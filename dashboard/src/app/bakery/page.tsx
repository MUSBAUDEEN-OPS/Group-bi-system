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

export default async function BakeryPage({ searchParams }: PageProps<"/bakery">) {
  const resolvedSearchParams = await searchParams;
  const range = resolveRangeFromSearchParams(resolvedSearchParams);
  const dataSource = getDataSource();
  const [snapshot, monthly, outlets, products, topProducts] = await Promise.all([
    dataSource.getKpiSnapshot(),
    dataSource.getSummaryMonthly(),
    dataSource.getReferenceOutlets(),
    dataSource.getReferenceProducts(),
    dataSource.getTopProducts(),
  ]);

  const productionVolume = aggregateKpi(snapshot, "Bakery", "Production Volume (Total)", range.months);
  const wasteRate = aggregateKpi(snapshot, "Bakery", "Waste / Spoilage Rate", range.months);
  const avgTransactionValue = aggregateKpi(snapshot, "Bakery", "Average Transaction Value", range.months);

  const salesByOutlet = outlets.map((o) => ({
    label: o.outlet_name,
    value: aggregateKpi(snapshot, "Bakery", `Sales per Outlet (${o.outlet_id})`, range.months) ?? 0,
  }));

  const marginByProduct = products
    .map((p) => ({
      label: p.product_name,
      value: aggregateKpi(snapshot, "Bakery", `Gross Margin (${p.product_id})`, range.months) ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const avgMargin = marginByProduct.length > 0 ? marginByProduct.reduce((s, p) => s + p.value, 0) / marginByProduct.length : null;

  const topProductRevenue = new Map<string, { name: string; value: number }>();
  for (const row of topProducts) {
    if (!range.months.includes(row.month) || row.rank_by !== "revenue") continue;
    const existing = topProductRevenue.get(row.product_id);
    topProductRevenue.set(row.product_id, { name: row.product_name, value: (existing?.value ?? 0) + row.value });
  }
  const topProductsRanked = [...topProductRevenue.values()].sort((a, b) => b.value - a.value).slice(0, 10);

  const productionTrend = kpiSeries(snapshot, "Bakery", "Production Volume (Total)", range.months);
  const monthlyRows = monthly.filter((m) => m.business_unit === "Bakery" && range.months.includes(m.month)).sort((a, b) => a.month.localeCompare(b.month));

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
      <h1 className="text-lg font-semibold text-[var(--foreground)]">Bakery</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Production Volume" starred value={productionVolume !== null ? `${formatCompactNumber(productionVolume)} units` : "—"} />
        <StatTile label="Sales per Outlet" starred value={formatCompactCurrency(salesByOutlet.reduce((s, o) => s + o.value, 0))} deltaLabel="total, by outlet below" />
        <StatTile label="Gross Margin per Product" starred value={avgMargin !== null ? formatPercent(avgMargin) : "—"} deltaLabel="average, top products" />
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatTile label="Waste / Spoilage Rate" value={wasteRate !== null ? formatPercent(wasteRate) : "—"} upIsGood={false} deltaPct={wasteRate} deltaLabel="of production" />
        <StatTile label="Average Transaction Value" value={avgTransactionValue !== null ? formatCompactCurrency(avgTransactionValue) : "—"} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart title="Production Volume (Ramadan/Eid spikes visible)" series={productionTrend} color={SERIES_COLOR.Bakery} format="number" />
        <BarChartCard title="Sales per Outlet" data={salesByOutlet} color={SERIES_COLOR.Bakery} format="currency" layout="horizontal" />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <BarChartCard title="Gross Margin per Product (top 8)" data={marginByProduct} color={SERIES_COLOR.Bakery} format="percent" layout="horizontal" />
        <BarChartCard
          title="Top-Selling Products by Revenue"
          data={topProductsRanked.map((p) => ({ label: p.name, value: p.value }))}
          color={SERIES_COLOR.Bakery}
          format="currency"
          layout="horizontal"
        />
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
