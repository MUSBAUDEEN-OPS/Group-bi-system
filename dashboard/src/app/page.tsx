import { Suspense } from "react";
import Link from "next/link";
import type { BusinessUnit, SummaryMonthly } from "@group-bi/kpi-lib";
import { getDataSource } from "@/data/getDataSource";
import { resolveRangeFromSearchParams } from "@/lib/dateRange";
import { aggregateKpi, kpiSeries } from "@/lib/kpiAggregate";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { UNIT_LABEL, trendColor } from "@/lib/chartColors";
import { formatSignedPercent } from "@/lib/format";
import { StatTile } from "@/components/StatTile";
import { DateRangeFilter } from "@/components/DateRangeFilter";

const UNITS: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];
const UNIT_HREF: Record<BusinessUnit, string> = { HajjUmrah: "/hajj-umrah", Hotel: "/hotel", Bakery: "/bakery" };

function sumRevenue(monthly: SummaryMonthly[], unit: BusinessUnit, months: string[]): number | null {
  const rows = monthly.filter((m) => m.business_unit === unit && months.includes(m.month));
  if (rows.length === 0) return null;
  return rows.reduce((sum, m) => sum + m.revenue, 0);
}

function pctDelta(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) return null;
  return (current - prior) / prior;
}

function searchParamsToQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params.toString();
}

export default async function GroupOverviewPage({ searchParams }: PageProps<"/">) {
  const resolvedSearchParams = await searchParams;
  const range = resolveRangeFromSearchParams(resolvedSearchParams);
  const query = searchParamsToQuery(resolvedSearchParams);
  const dataSource = getDataSource();
  const [snapshot, monthly] = await Promise.all([dataSource.getKpiSnapshot(), dataSource.getSummaryMonthly()]);

  const revenue = aggregateKpi(snapshot, "Group", "Consolidated Revenue", range.months);
  const revenuePrior = aggregateKpi(snapshot, "Group", "Consolidated Revenue", range.priorPeriodMonths);
  const netProfit = aggregateKpi(snapshot, "Group", "Consolidated Net Profit", range.months);
  const netProfitPrior = aggregateKpi(snapshot, "Group", "Consolidated Net Profit", range.priorPeriodMonths);
  const margin = aggregateKpi(snapshot, "Group", "Consolidated Net Profit Margin", range.months);
  const cashPosition = aggregateKpi(snapshot, "Group", "Cash Position", range.months);
  const cashPositionPrior = aggregateKpi(snapshot, "Group", "Cash Position", range.priorPeriodMonths);
  const headcount = aggregateKpi(snapshot, "Group", "Group Headcount", range.months);
  const payrollPct = aggregateKpi(snapshot, "Group", "Payroll Cost % of Revenue (Group)", range.months);

  const budgetTargetTotal = UNITS.reduce((sum, u) => sum + (aggregateKpi(snapshot, u, "Budget Target", range.months) ?? 0), 0);
  const varianceTotal = UNITS.reduce((sum, u) => sum + (aggregateKpi(snapshot, u, "Budget vs Actual Variance", range.months) ?? 0), 0);

  const revenueTrend = kpiSeries(snapshot, "Group", "Consolidated Revenue", range.months).map((p) => p.value);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">Group Overview</h1>
        <Suspense>
          <DateRangeFilter currentPreset={range.preset} from={resolvedSearchParams.from as string | undefined} to={resolvedSearchParams.to as string | undefined} />
        </Suspense>
      </div>

      <section aria-label="Headline KPIs" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Consolidated Revenue"
          starred
          value={revenue !== null ? formatCompactCurrency(revenue) : "—"}
          deltaPct={pctDelta(revenue, revenuePrior)}
          deltaLabel="vs prior period"
          trend={revenueTrend}
        />
        <StatTile
          label="Net Profit"
          starred
          value={netProfit !== null ? formatCompactCurrency(netProfit) : "—"}
          deltaPct={pctDelta(netProfit, netProfitPrior)}
          deltaLabel={margin !== null ? `margin ${formatPercent(margin)}` : "vs prior period"}
        />
        <StatTile
          label="Cash Position"
          starred
          value={cashPosition !== null ? formatCompactCurrency(cashPosition) : "—"}
          deltaPct={pctDelta(cashPosition, cashPositionPrior)}
          deltaLabel="vs prior period"
        />
        <StatTile
          label="Group Headcount"
          starred
          value={headcount !== null ? headcount.toLocaleString() : "—"}
          deltaLabel={payrollPct !== null ? `payroll ${formatPercent(payrollPct)} of revenue` : undefined}
        />
        <StatTile
          label="Budget vs Actual"
          starred
          value={formatCompactCurrency(varianceTotal)}
          deltaLabel={budgetTargetTotal ? `target ${formatCompactCurrency(budgetTargetTotal)}` : undefined}
          deltaPct={budgetTargetTotal ? varianceTotal / budgetTargetTotal : null}
          upIsGood
        />
      </section>

      <section aria-label="Business unit trends" className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">Business units</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {UNITS.map((unit) => {
            const unitRevenue = sumRevenue(monthly, unit, range.months);
            const unitRevenuePrior = sumRevenue(monthly, unit, range.priorPeriodMonths);
            const delta = pctDelta(unitRevenue, unitRevenuePrior);
            const up = delta !== null && delta >= 0;
            return (
              <Link
                key={unit}
                href={`${UNIT_HREF[unit]}${query ? `?${query}` : ""}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-shadow hover:shadow-md"
              >
                <div>
                  <div className="text-sm font-medium text-[var(--foreground)]">{UNIT_LABEL[unit]}</div>
                  <div className="text-xs text-[var(--text-muted)]">{unitRevenue !== null ? formatCompactCurrency(unitRevenue) : "—"}</div>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium" style={{ color: delta === null ? "var(--text-muted)" : trendColor(delta, true) }}>
                  <span aria-hidden>{delta === null ? "" : up ? "▲" : "▼"}</span>
                  <span>{delta === null ? "—" : formatSignedPercent(delta)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
