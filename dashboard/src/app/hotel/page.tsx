import { Suspense } from "react";
import Link from "next/link";
import { getDataSource } from "@/data/getDataSource";
import { getExchangeRate } from "@/data/exchangeRate";
import { deriveDataBounds, resolveRangeFromSearchParams } from "@/lib/dateRange";
import { resolveLangFromSearchParams } from "@/lib/i18n/resolveLang";
import { translations } from "@/lib/i18n/translations";
import { aggregateKpi, kpiSeries } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { convertFromNGN, isCurrency, type Currency } from "@/lib/currency";
import { SERIES_COLOR } from "@/lib/chartColors";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { SectionBackground } from "@/components/SectionBackground";
import { TrendChart } from "@/components/TrendChart";
import { BarChartCard } from "@/components/BarChartCard";
import { DataTable } from "@/components/DataTable";

export default async function HotelPage({ searchParams }: PageProps<"/hotel">) {
  const resolvedSearchParams = await searchParams;
  const lang = resolveLangFromSearchParams(resolvedSearchParams);
  const currency: Currency = isCurrency(resolvedSearchParams.currency as string | undefined) ? (resolvedSearchParams.currency as Currency) : "NGN";
  const t = translations[lang];
  const dataSource = getDataSource();
  const [snapshot, monthly, channelMix, rateInfo] = await Promise.all([
    dataSource.getKpiSnapshot(),
    dataSource.getSummaryMonthly(),
    dataSource.getBookingChannelMix(),
    getExchangeRate(),
  ]);
  const range = resolveRangeFromSearchParams(resolvedSearchParams, deriveDataBounds(monthly));
  const money = (v: number) => formatCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);
  const moneyCompact = (v: number) => formatCompactCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);

  const occupancy = aggregateKpi(snapshot, "Hotel", "Occupancy Rate", range.months);
  const adr = aggregateKpi(snapshot, "Hotel", "ADR", range.months);
  const revpar = aggregateKpi(snapshot, "Hotel", "RevPAR", range.months);
  const fnbPerRoom = aggregateKpi(snapshot, "Hotel", "F&B Revenue per Occupied Room", range.months);
  const guestSatisfaction = aggregateKpi(snapshot, "Hotel", "Guest Satisfaction Score", range.months);
  const avgLengthOfStay = aggregateKpi(snapshot, "Hotel", "Average Length of Stay", range.months);

  const occupancyTrend = kpiSeries(snapshot, "Hotel", "Occupancy Rate", range.months);

  const channelLabel: Record<string, string> = { direct: t.hotel.direct, agent: t.hotel.agent, OTA: t.hotel.ota };
  const channelTotals = new Map<string, number>();
  for (const row of channelMix) {
    if (!range.months.includes(row.month)) continue;
    channelTotals.set(row.booking_channel, (channelTotals.get(row.booking_channel) ?? 0) + row.count);
  }
  const channelData = [...channelTotals.entries()].map(([channel, value]) => ({ label: channelLabel[channel] ?? channel, value }));

  const monthlyRows = monthly.filter((m) => m.business_unit === "Hotel" && range.months.includes(m.month)).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SectionBackground variant="hotel" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/?${passthroughQuery(resolvedSearchParams)}`} className="text-sm text-[var(--text-secondary)] hover:underline">
          {lang === "ar" ? "→" : "←"} {t.nav.backToGroupOverview}
        </Link>
        <Suspense>
          <div className="flex flex-wrap items-center gap-2">
            <CurrencyToggle currentCurrency={currency} rateInfo={rateInfo} lang={lang} />
            <DateRangeFilter currentPreset={range.preset} from={resolvedSearchParams.from as string | undefined} to={resolvedSearchParams.to as string | undefined} bounds={range.bounds} />
          </div>
        </Suspense>
      </div>
      <h1 className="text-lg font-semibold text-[var(--foreground)]">{t.hotel.pageTitle}</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t.hotel.occupancyRate} starred value={occupancy !== null ? formatPercent(occupancy) : "—"} />
        <StatTile label={t.hotel.adr} starred value={adr !== null ? moneyCompact(adr) : "—"} deltaLabel={t.hotel.averageDailyRate} />
        <StatTile label={t.hotel.revpar} starred value={revpar !== null ? moneyCompact(revpar) : "—"} deltaLabel={t.hotel.revenuePerAvailableRoom} />
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t.hotel.fnbRevenuePerRoom} value={fnbPerRoom !== null ? moneyCompact(fnbPerRoom) : "—"} />
        <StatTile label={t.hotel.guestSatisfaction} value={guestSatisfaction !== null ? `${guestSatisfaction.toFixed(1)} / 5` : "—"} />
        <StatTile label={t.hotel.avgLengthOfStay} value={avgLengthOfStay !== null ? `${avgLengthOfStay.toFixed(1)} ${t.hotel.nights}` : "—"} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart
          title={t.hotel.occupancyRate}
          series={occupancyTrend}
          color={SERIES_COLOR.Hotel}
          format="percent"
          lang={lang}
          labels={{ value: t.common.value, mom: t.common.momPercent, yoy: t.common.yoyPercent, insufficientHistory: t.common.insufficientHistory }}
        />
        <BarChartCard title={t.hotel.bookingChannelChart} data={channelData} color={SERIES_COLOR.Hotel} format="rawNumber" layout="horizontal" />
      </section>

      <DataTable
        title={t.common.monthlySummary}
        rows={monthlyRows}
        columns={[
          { key: "month", header: t.common.month, render: (r) => monthLabel(r.month, lang) },
          { key: "revenue", header: t.common.revenue, align: "right", render: (r) => money(r.revenue) },
          { key: "cogs", header: t.common.cogs, align: "right", render: (r) => money(r.cogs) },
          { key: "opex", header: t.common.opex, align: "right", render: (r) => money(r.opex) },
          { key: "gross_profit", header: t.common.grossProfit, align: "right", render: (r) => money(r.gross_profit) },
          { key: "net_profit", header: t.common.netProfit, align: "right", render: (r) => money(r.net_profit) },
          { key: "headcount", header: t.common.headcount, align: "right", render: (r) => r.headcount.toString() },
          { key: "payroll_cost", header: t.common.payrollCost, align: "right", render: (r) => money(r.payroll_cost) },
        ]}
      />
    </div>
  );
}

function passthroughQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params.toString();
}
