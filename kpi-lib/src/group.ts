import type { KpiConfig } from "./config.js";
import type { BusinessUnit, RawExpense, SummaryMonthly } from "./types.js";

const UNITS: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];

export function consolidatedRevenue(monthly: SummaryMonthly[]): number {
  return monthly.reduce((sum, m) => sum + m.revenue, 0);
}

export function consolidatedNetProfit(monthly: SummaryMonthly[]): number {
  return monthly.reduce((sum, m) => sum + m.net_profit, 0);
}

export function consolidatedNetProfitMargin(monthly: SummaryMonthly[]): {
  netProfit: number;
  margin: number;
} {
  const revenue = consolidatedRevenue(monthly);
  const netProfit = consolidatedNetProfit(monthly);
  return { netProfit, margin: revenue === 0 ? 0 : netProfit / revenue };
}

export function ebitda(monthly: SummaryMonthly[], config: KpiConfig): number {
  const revenue = consolidatedRevenue(monthly);
  const netProfit = consolidatedNetProfit(monthly);
  return netProfit + revenue * config.ebitdaAddBackPct;
}

export interface CashPositionPoint {
  month: string;
  netCashFlow: number;
  balance: number;
}

export function cashPositionSeries(
  allMonthly: SummaryMonthly[],
  groupOverheadExpenses: RawExpense[],
  openingBalance: number,
): CashPositionPoint[] {
  const months = [...new Set(allMonthly.map((m) => m.month))].sort();
  const netProfitByMonth = new Map<string, number>();
  for (const m of allMonthly) {
    netProfitByMonth.set(m.month, (netProfitByMonth.get(m.month) ?? 0) + m.net_profit);
  }
  const overheadByMonth = new Map<string, number>();
  for (const e of groupOverheadExpenses) {
    const month = e.date.slice(0, 7);
    overheadByMonth.set(month, (overheadByMonth.get(month) ?? 0) + e.amount);
  }
  let balance = openingBalance;
  return months.map((month) => {
    const netCashFlow = (netProfitByMonth.get(month) ?? 0) - (overheadByMonth.get(month) ?? 0);
    balance += netCashFlow;
    return { month, netCashFlow, balance };
  });
}

export function revenueMixByUnit(monthly: SummaryMonthly[]): Record<BusinessUnit, number> {
  const revenueByUnit: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const m of monthly) revenueByUnit[m.business_unit] += m.revenue;
  const total = UNITS.reduce((sum, u) => sum + revenueByUnit[u], 0);
  const result: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const u of UNITS) result[u] = total === 0 ? 0 : revenueByUnit[u] / total;
  return result;
}

export function roiPerUnit(monthly: SummaryMonthly[], config: KpiConfig): Record<BusinessUnit, number> {
  const netProfitByUnit: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const m of monthly) netProfitByUnit[m.business_unit] += m.net_profit;
  const result: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const u of UNITS) {
    const capital = config.capitalEmployedByUnit[u];
    result[u] = capital === 0 ? 0 : netProfitByUnit[u] / capital;
  }
  return result;
}

export function groupHeadcountAndPayrollPct(monthly: SummaryMonthly[]): {
  headcount: number;
  payrollCostPct: number;
} {
  const headcount = monthly.reduce((sum, m) => sum + m.headcount, 0);
  const revenue = consolidatedRevenue(monthly);
  const payrollCost = monthly.reduce((sum, m) => sum + m.payroll_cost, 0);
  return { headcount, payrollCostPct: revenue === 0 ? 0 : payrollCost / revenue };
}

export function budgetVsActualVariance(
  monthly: SummaryMonthly[],
  config: KpiConfig,
): Array<{ month: string; business_unit: BusinessUnit; actual: number; budget: number; variance: number }> {
  return monthly.map((m) => {
    const budget = config.budgetTargetsByUnit[m.business_unit]?.[m.month] ?? 0;
    return { month: m.month, business_unit: m.business_unit, actual: m.revenue, budget, variance: m.revenue - budget };
  });
}

export function yoyGrowth(currentValue: number, priorYearValue: number | undefined): number | "insufficient history" {
  if (priorYearValue === undefined || priorYearValue === 0) return "insufficient history";
  return (currentValue - priorYearValue) / priorYearValue;
}
