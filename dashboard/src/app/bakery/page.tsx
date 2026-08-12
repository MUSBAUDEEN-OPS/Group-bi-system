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

export default async function BakeryPage({ searchParams }: PageProps<"/bakery">) {
  const resolvedSearchParams = await searchParams;
  const lang = resolveLangFromSearchParams(resolvedSearchParams);
  const currency: Currency = isCurrency(resolvedSearchParams.currency as string | undefined) ? (resolvedSearchParams.currency as Currency) : "NGN";
  const t = translations[lang];
  const dataSource = getDataSource();
  const [snapshot, monthly, outlets, products, topProducts, rateInfo] = await Promise.all([
    dataSource.getKpiSnapshot(),
    dataSource.getSummaryMonthly(),
    dataSource.getReferenceOutlets(),
    dataSource.getReferenceProducts(),
    dataSource.getTopProducts(),
    getExchangeRate(),
  ]);
  const range = resolveRangeFromSearchParams(resolvedSearchParams, deriveDataBounds(monthly));
  const money = (v: number) => formatCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);
  const moneyCompact = (v: number) => formatCompactCurrency(convertFromNGN(v, currency, rateInfo.rate), currency);

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
      <SectionBackground variant="bakery" />
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
      <h1 className="text-lg font-semibold text-[var(--foreground)]">{t.bakery.pageTitle}</h1>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t.bakery.productionVolume} starred value={productionVolume !== null ? `${formatCompactNumber(productionVolume)} ${t.bakery.units}` : "—"} />
        <StatTile label={t.bakery.salesPerOutlet} starred value={moneyCompact(salesByOutlet.reduce((s, o) => s + o.value, 0))} deltaLabel={t.bakery.totalByOutletBelow} />
        <StatTile label={t.bakery.grossMarginPerProduct} starred value={avgMargin !== null ? formatPercent(avgMargin) : "—"} deltaLabel={t.bakery.averageTopProducts} />
      </section>

      <section aria-label="Secondary KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatTile label={t.bakery.wasteRate} value={wasteRate !== null ? formatPercent(wasteRate) : "—"} upIsGood={false} deltaPct={wasteRate} deltaLabel={t.bakery.ofProduction} />
        <StatTile label={t.bakery.avgTransactionValue} value={avgTransactionValue !== null ? moneyCompact(avgTransactionValue) : "—"} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TrendChart
          title={t.bakery.productionChartTitle}
          series={productionTrend}
          color={SERIES_COLOR.Bakery}
          format="number"
          lang={lang}
          labels={{ value: t.common.value, mom: t.common.momPercent, yoy: t.common.yoyPercent, insufficientHistory: t.common.insufficientHistory }}
        />
        <BarChartCard title={t.bakery.salesPerOutletChart} data={salesByOutlet} color={SERIES_COLOR.Bakery} format="currency" currency={currency} rate={rateInfo.rate} layout="horizontal" />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <BarChartCard title={t.bakery.grossMarginTop8} data={marginByProduct} color={SERIES_COLOR.Bakery} format="percent" layout="horizontal" />
        <BarChartCard
          title={t.bakery.topSellingProducts}
          data={topProductsRanked.map((p) => ({ label: p.name, value: p.value }))}
          color={SERIES_COLOR.Bakery}
          format="currency"
          currency={currency}
          rate={rateInfo.rate}
          layout="horizontal"
        />
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
