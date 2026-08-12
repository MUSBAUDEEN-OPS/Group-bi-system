import { Suspense } from "react";
import Link from "next/link";
import { getDataSource } from "@/data/getDataSource";
import { resolveRangeFromSearchParams } from "@/lib/dateRange";
import { aggregateKpi, kpiSeries } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { SERIES_COLOR } from "@/lib/chartColors";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TrendChart } from "@/components/TrendChart";
import { BarChartCard } from "@/components/BarChartCard";
import { DataTable } from "@/components/DataTable";

export default async function HotelPage({ searchParams }: PageProps<"/hotel">) {
  const resolvedSearchParams = await searchParams;
  const range = resolveRangeFromSearchParams(resolvedSearchParams);
  const dataSource = getDataSource();
  const [snapshot, monthly, channelMix] = await Promise.all([
    dataSource.getKpiSnapshot(),
    dataSource.getSummaryMonthly(),
    dataSource.getBookingChannelMix(),
  ]);

  const occupancy = aggregateKpi(snapshot, "Hotel", "Occupancy Rate", range.months);
  const adr = aggregateKpi(snapshot, "Hotel", "ADR", range.months);
  const revpar = aggregateKpi(snapshot, "Hotel", "RevPAR", range.months);
  const fnbPerRoom = aggregateKpi(snapshot, "Hotel", "F&B Revenue per Occupied Room", range.months);
  const guestSatisfaction = aggregateKpi(snapshot, "Hotel", "Guest Satisfaction Score", range.months);
  const avgLengthOfStay = aggregateKpi(snapshot, "Hotel", "Average Length of Stay", range.months);

  const occupancyTrend = kpiSeries(snapshot, "Hotel", "Occupancy Rate", range.months);

  const channelTotals = new Map<string, number>();
  for (const row of channelMix) {
    if (!range.months.includes(row.month)) continue;
    channelTotals.set(row.booking_channel, (channelTotals.get(row.booking_channel) ?? 0) + row.count);
  }
  const channelData = [...channelTotals.entries()].map(([label, value]) => ({ label, value }));

  const monthlyRows = monthly.filter((m) => m.business_unit === "Hotel" && range.months.includes(m.month)).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/?${passthroughQuery(resolvedSearchParams)}`} className="text-sm text-[var(--text-secondary)] hover:underline">
          ← Group Overview
        </Link>
        <Suspense>
          <DateRangeFilter currentPreset={range.preset} from={resolvedSearchParams.from as string | undefined} to={resolvedSearchParams.to as string | undefined} />
        </Suspense>
      </div>
      <h1 className="text-lg font-semibold text-[var(--foreground)]">Hotel</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Occupancy Rate" starred value={occupancy !== null ? formatPercent(occupancy) : "—"} />
        <StatTile label="ADR" starred value={adr !== null ? formatCompactCurrency(adr) : "—"} deltaLabel="average daily rate" />
        <StatTile label="RevPAR" starred value={revpar !== null ? formatCompactCurrency(revpar) : "—"} deltaLabel="revenue per available room" />
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="F&B Revenue / Occupied Room" value={fnbPerRoom !== null ? formatCompactCurrency(fnbPerRoom) : "—"} />
        <StatTile label="Guest Satisfaction" value={guestSatisfaction !== null ? `${guestSatisfaction.toFixed(1)} / 5` : "—"} />
        <StatTile label="Average Length of Stay" value={avgLengthOfStay !== null ? `${avgLengthOfStay.toFixed(1)} nights` : "—"} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart title="Occupancy Rate" series={occupancyTrend} color={SERIES_COLOR.Hotel} format="percent" />
        <BarChartCard title="Direct vs Agent vs OTA bookings" data={channelData} color={SERIES_COLOR.Hotel} format="rawNumber" layout="horizontal" />
      </section>

      <DataTable
        title="Monthly summary"
        rows={monthlyRows}
        columns={[
          { key: "month", header: "Month", render: (r) => monthLabel(r.month) },
          { key: "revenue", header: "Revenue", align: "right", render: (r) => formatCurrency(r.revenue) },
          { key: "cogs", header: "COGS", align: "right", render: (r) => formatCurrency(r.cogs) },
          { key: "opex", header: "OpEx", align: "right", render: (r) => formatCurrency(r.opex) },
          { key: "gross_profit", header: "Gross Profit", align: "right", render: (r) => formatCurrency(r.gross_profit) },
          { key: "net_profit", header: "Net Profit", align: "right", render: (r) => formatCurrency(r.net_profit) },
          { key: "headcount", header: "Headcount", align: "right", render: (r) => r.headcount.toString() },
          { key: "payroll_cost", header: "Payroll Cost", align: "right", render: (r) => formatCurrency(r.payroll_cost) },
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
