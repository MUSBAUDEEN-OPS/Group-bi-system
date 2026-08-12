import type { KpiScope, SummaryKpiSnapshot } from "@group-bi/kpi-lib";

// How a KPI combines across a multi-month range. Flow metrics (revenue,
// counts) sum; ratios/rates average (a documented simplification — the
// precomputed snapshot table stores the ratio itself, not its numerator and
// denominator separately, so an exact recomposition isn't available without
// re-reading raw data, which the brief explicitly says not to do at render
// time); point-in-time metrics (headcount, cash balance) take the latest month.
const SUM_PATTERNS = [
  /^Pilgrims Served/,
  /^Package Revenue/,
  /^Production Volume/,
  /^Sales per Outlet/,
  /^Overtime (Hours|Cost)$/,
  /^Budget Target$/,
  /^Budget vs Actual Variance$/,
  /^Raw Material Cost Variance/,
  /^Consolidated Revenue$/,
  /^Consolidated Net Profit$/,
  /^EBITDA$/,
];
const LATEST_PATTERNS = [/^Cash Position$/, /^Headcount/, /^Group Headcount$/];

function aggregationFor(kpiName: string): "sum" | "latest" | "average" {
  if (SUM_PATTERNS.some((p) => p.test(kpiName))) return "sum";
  if (LATEST_PATTERNS.some((p) => p.test(kpiName))) return "latest";
  return "average";
}

export function aggregateKpi(
  snapshot: SummaryKpiSnapshot[],
  scope: KpiScope,
  kpiName: string,
  months: string[],
): number | null {
  const rows = snapshot
    .filter((r) => r.business_unit === scope && r.kpi_name === kpiName && months.includes(r.month))
    .sort((a, b) => a.month.localeCompare(b.month));
  if (rows.length === 0) return null;

  const mode = aggregationFor(kpiName);
  if (mode === "sum") return rows.reduce((sum, r) => sum + r.kpi_value, 0);
  if (mode === "latest") return rows[rows.length - 1].kpi_value;
  return rows.reduce((sum, r) => sum + r.kpi_value, 0) / rows.length;
}

export function kpiSeries(
  snapshot: SummaryKpiSnapshot[],
  scope: KpiScope,
  kpiName: string,
  months: string[],
): Array<{ month: string; value: number }> {
  const byMonth = new Map(
    snapshot.filter((r) => r.business_unit === scope && r.kpi_name === kpiName).map((r) => [r.month, r.kpi_value]),
  );
  return months.map((month) => ({ month, value: byMonth.get(month) ?? 0 }));
}
