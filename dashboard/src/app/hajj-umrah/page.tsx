import { Suspense } from "react";
import Link from "next/link";
import { getDataSource } from "@/data/getDataSource";
import { getExchangeRate } from "@/data/exchangeRate";
import { deriveDataBounds, resolveRangeFromSearchParams } from "@/lib/dateRange";
import { resolveLangFromSearchParams } from "@/lib/i18n/resolveLang";
import { translations } from "@/lib/i18n/translations";
import { aggregateKpi, kpiSeries } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { convertFromNGN, isCurrency, type Currency } from "@/lib/currency";
import { SERIES_COLOR } from "@/lib/chartColors";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { SectionBackground } from "@/components/SectionBackground";
import { TrendChart } from "@/components/TrendChart";
import { BarChartCard } from "@/components/BarChartCard";
import { DataTable } from "@/components/DataTable";

export default async function HajjUmrahPage({ searchParams }: PageProps<"/hajj-umrah">) {
  const resolvedSearchParams = await searchParams;
  const lang = resolveLangFromSearchParams(resolvedSearchParams);
  const currency: Currency = isCurrency(resolvedSearchParams.currency as string | undefined) ? (resolvedSearchParams.currency as Currency) : "NGN";
  const t = translations[lang];
  const dataSource = getDataSource();
  const [snapshot, monthly, rateInfo] = await Promise.all([dataSource.getKpiSnapshot(), dataSource.getSummaryMonthly(), getExchangeRate()]);
  const range = resolveRangeFromSearchParams(resolvedSearchParams, deriveDataBounds(monthly));
  const money = (v: number) => formatCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);
  const moneyCompact = (v: number) => formatCompactCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);

  const pilgrims = aggregateKpi(snapshot, "HajjUmrah", "Pilgrims Served (Total)", range.months);
  const pilgrimsHajj = aggregateKpi(snapshot, "HajjUmrah", "Pilgrims Served (Hajj)", range.months);
  const pilgrimsUmrah = aggregateKpi(snapshot, "HajjUmrah", "Pilgrims Served (Umrah)", range.months);
  const revenueEconomy = aggregateKpi(snapshot, "HajjUmrah", "Package Revenue (Economy)", range.months) ?? 0;
  const revenueStandard = aggregateKpi(snapshot, "HajjUmrah", "Package Revenue (Standard)", range.months) ?? 0;
  const revenueVip = aggregateKpi(snapshot, "HajjUmrah", "Package Revenue (VIP)", range.months) ?? 0;
  const packageRevenue = revenueEconomy + revenueStandard + revenueVip;
  const cancellationRate = aggregateKpi(snapshot, "HajjUmrah", "Cancellation / Refund Rate", range.months);
  const nps = aggregateKpi(snapshot, "HajjUmrah", "Customer Satisfaction (NPS)", range.months);
  const avgRevenuePerPilgrim = aggregateKpi(snapshot, "HajjUmrah", "Average Revenue per Pilgrim", range.months);
  const conversionRate = aggregateKpi(snapshot, "HajjUmrah", "Booking Conversion Rate", range.months);
  const visaCostPerPilgrim = aggregateKpi(snapshot, "HajjUmrah", "Visa & Permit Cost per Pilgrim", range.months);
  const fillRate = aggregateKpi(snapshot, "HajjUmrah", "Group Departure Fill Rate", range.months);
  const repeatRate = aggregateKpi(snapshot, "HajjUmrah", "Repeat Customer Rate (YTD)", range.months);

  const pilgrimsTrend = kpiSeries(snapshot, "HajjUmrah", "Pilgrims Served (Total)", range.months);
  const revenueByTier = [
    { label: t.hajjUmrah.economy, value: revenueEconomy },
    { label: t.hajjUmrah.standard, value: revenueStandard },
    { label: t.hajjUmrah.vip, value: revenueVip },
  ];

  const monthlyRows = monthly.filter((m) => m.business_unit === "HajjUmrah" && range.months.includes(m.month)).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SectionBackground variant="hajjUmrah" />
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
      <h1 className="text-lg font-semibold text-[var(--foreground)]">{t.hajjUmrah.pageTitle}</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label={t.hajjUmrah.pilgrimsServed}
          starred
          value={pilgrims !== null ? formatCompactNumber(pilgrims) : "—"}
          deltaLabel={pilgrimsHajj !== null && pilgrimsUmrah !== null ? `${pilgrimsHajj} ${t.hajjUmrah.hajj} · ${pilgrimsUmrah} ${t.hajjUmrah.umrah}` : undefined}
        />
        <StatTile label={t.hajjUmrah.packageRevenue} starred value={moneyCompact(packageRevenue)} deltaLabel={t.hajjUmrah.byTierBelow} />
        <StatTile
          label={t.hajjUmrah.cancellationRefundRate}
          starred
          value={cancellationRate !== null ? formatPercent(cancellationRate) : "—"}
          upIsGood={false}
          deltaPct={cancellationRate}
          deltaLabel={t.hajjUmrah.ofBookings}
        />
        <StatTile label={t.hajjUmrah.customerSatisfactionNps} starred value={nps !== null ? nps.toFixed(0) : "—"} deltaLabel={t.hajjUmrah.promotersDetractors} />
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label={t.hajjUmrah.avgRevenuePerPilgrim} value={avgRevenuePerPilgrim !== null ? moneyCompact(avgRevenuePerPilgrim) : "—"} />
        <StatTile label={t.hajjUmrah.bookingConversionRate} value={conversionRate !== null ? formatPercent(conversionRate) : "—"} />
        <StatTile label={t.hajjUmrah.visaPermitCostPerPilgrim} value={visaCostPerPilgrim !== null ? moneyCompact(visaCostPerPilgrim) : "—"} />
        <StatTile label={t.hajjUmrah.departureFillRate} value={fillRate !== null ? formatPercent(fillRate) : "—"} />
        <StatTile label={t.hajjUmrah.repeatCustomerRate} value={repeatRate !== null ? formatPercent(repeatRate) : "—"} deltaLabel={t.hajjUmrah.yearToDateLabel} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart
          title={t.hajjUmrah.pilgrimsChartTitle}
          series={pilgrimsTrend}
          color={SERIES_COLOR.HajjUmrah}
          format="number"
          lang={lang}
          labels={{ value: t.common.value, mom: t.common.momPercent, yoy: t.common.yoyPercent, insufficientHistory: t.common.insufficientHistory }}
        />
        <BarChartCard title={t.hajjUmrah.packageRevenueByTier} data={revenueByTier} color={SERIES_COLOR.HajjUmrah} format="currency" currency={currency} rate={rateInfo.rate} />
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
