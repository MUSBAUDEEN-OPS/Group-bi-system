import type { BusinessUnit, RawPayroll, ReferenceEmployee } from "./types.js";

function isActiveAsOf(e: ReferenceEmployee, asOfDate: string): boolean {
  return e.hire_date <= asOfDate && (e.termination_date === null || e.termination_date > asOfDate);
}

export function headcountByUnitDepartment(
  employees: ReferenceEmployee[],
  asOfDate: string,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of employees) {
    if (!isActiveAsOf(e, asOfDate)) continue;
    const key = `${e.business_unit}::${e.department}`;
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

export function headcountByUnit(
  employees: ReferenceEmployee[],
  asOfDate: string,
): Record<BusinessUnit, number> {
  const result: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const e of employees) {
    if (!isActiveAsOf(e, asOfDate)) continue;
    result[e.business_unit] += 1;
  }
  return result;
}

export function payrollCostByUnit(payroll: RawPayroll[]): Record<BusinessUnit, number> {
  const result: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const p of payroll) {
    result[p.business_unit] += p.base_salary + p.overtime_pay + p.bonus;
  }
  return result;
}

export function payrollCostPctRevenue(
  payroll: RawPayroll[],
  revenueByUnit: Record<BusinessUnit, number>,
): Record<BusinessUnit, number> {
  const cost = payrollCostByUnit(payroll);
  const result: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const unit of Object.keys(result) as BusinessUnit[]) {
    result[unit] = revenueByUnit[unit] === 0 ? 0 : cost[unit] / revenueByUnit[unit];
  }
  return result;
}

export function staffTurnoverRate(
  employees: ReferenceEmployee[],
  periodStart: string,
  periodEnd: string,
): number {
  const terminations = employees.filter(
    (e) => e.termination_date !== null && e.termination_date >= periodStart && e.termination_date <= periodEnd,
  ).length;
  const headcountStart = employees.filter((e) => isActiveAsOf(e, periodStart)).length;
  const headcountEnd = employees.filter((e) => isActiveAsOf(e, periodEnd)).length;
  const avgHeadcount = (headcountStart + headcountEnd) / 2;
  return avgHeadcount === 0 ? 0 : terminations / avgHeadcount;
}

export function overtimeHoursAndCost(payroll: RawPayroll[]): { hours: number; cost: number } {
  return payroll.reduce(
    (acc, p) => ({ hours: acc.hours + p.overtime_hours, cost: acc.cost + p.overtime_pay }),
    { hours: 0, cost: 0 },
  );
}

export function productivityRevenuePerEmployee(
  revenueByUnit: Record<BusinessUnit, number>,
  headcount: Record<BusinessUnit, number>,
): Record<BusinessUnit, number> {
  const result: Record<BusinessUnit, number> = { HajjUmrah: 0, Hotel: 0, Bakery: 0 };
  for (const unit of Object.keys(result) as BusinessUnit[]) {
    result[unit] = headcount[unit] === 0 ? 0 : revenueByUnit[unit] / headcount[unit];
  }
  return result;
}
