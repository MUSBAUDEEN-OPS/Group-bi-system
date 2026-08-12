import { Suspense } from "react";
import Link from "next/link";
import { getDataSource } from "@/data/getDataSource";
import { resolveRangeFromSearchParams } from "@/lib/dateRange";
import { aggregateKpi, kpiSeries } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatCompactNumber, formatCurrency, formatPercent, monthLabel } from "@/lib/format";
import { SERIES_COLOR } from "@/lib/chartColors";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { TrendChart } from "@/components/TrendChart";
import { BarChartCard } from "@/components/BarChartCard";
import { DataTable } from "@/components/DataTable";

export default async function HajjUmrahPage({ searchParams }: PageProps<"/hajj-umrah">) {
  const resolvedSearchParams = await searchParams;
  const range = resolveRangeFromSearchParams(resolvedSearchParams);
  const dataSource = getDataSource();
  const [snapshot, monthly] = await Promise.all([dataSource.getKpiSnapshot(), dataSource.getSummaryMonthly()]);

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
    { label: "Economy", value: revenueEconomy },
    { label: "Standard", value: revenueStandard },
    { label: "VIP", value: revenueVip },
  ];

  const monthlyRows = monthly.filter((m) => m.business_unit === "HajjUmrah" && range.months.includes(m.month)).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={`/?${passthroughQuery(resolvedSearchParams)}`} className="text-sm text-[var(--text-secondary)] hover:underline">
            ← Group Overview
          </Link>
        </div>
        <Suspense>
          <DateRangeFilter currentPreset={range.preset} from={resolvedSearchParams.from as string | undefined} to={resolvedSearchParams.to as string | undefined} />
        </Suspense>
      </div>
      <h1 className="text-lg font-semibold text-[var(--foreground)]">Hajj & Umrah Tourism</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pilgrims Served" starred value={pilgrims !== null ? formatCompactNumber(pilgrims) : "—"} deltaLabel={pilgrimsHajj !== null && pilgrimsUmrah !== null ? `${pilgrimsHajj} Hajj · ${pilgrimsUmrah} Umrah` : undefined} />
        <StatTile label="Package Revenue" starred value={formatCompactCurrency(packageRevenue)} deltaLabel="by tier below" />
        <StatTile label="Cancellation / Refund Rate" starred value={cancellationRate !== null ? formatPercent(cancellationRate) : "—"} upIsGood={false} deltaPct={cancellationRate} deltaLabel="of bookings" />
        <StatTile label="Customer Satisfaction (NPS)" starred value={nps !== null ? nps.toFixed(0) : "—"} deltaLabel="promoters − detractors" />
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Avg Revenue / Pilgrim" value={avgRevenuePerPilgrim !== null ? formatCompactCurrency(avgRevenuePerPilgrim) : "—"} />
        <StatTile label="Booking Conversion Rate" value={conversionRate !== null ? formatPercent(conversionRate) : "—"} />
        <StatTile label="Visa & Permit Cost / Pilgrim" value={visaCostPerPilgrim !== null ? formatCompactCurrency(visaCostPerPilgrim) : "—"} />
        <StatTile label="Departure Fill Rate" value={fillRate !== null ? formatPercent(fillRate) : "—"} />
        <StatTile label="Repeat Customer Rate" value={repeatRate !== null ? formatPercent(repeatRate) : "—"} deltaLabel="year to date" />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart title="Pilgrims Served (Hajj season spike visible in June)" series={pilgrimsTrend} color={SERIES_COLOR.HajjUmrah} format="number" />
        <BarChartCard title="Package Revenue by Tier" data={revenueByTier} color={SERIES_COLOR.HajjUmrah} format="currency" />
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
