import { describe, expect, it } from "vitest";
import {
  budgetVsActualVariance,
  cashPositionSeries,
  consolidatedNetProfitMargin,
  consolidatedRevenue,
  groupHeadcountAndPayrollPct,
} from "./group.js";
import type { KpiConfig } from "./config.js";
import type { RawExpense, SummaryMonthly } from "./types.js";

function monthly(overrides: Partial<SummaryMonthly>): SummaryMonthly {
  return {
    month: "2025-01",
    business_unit: "Hotel",
    revenue: 1000,
    cogs: 300,
    opex: 200,
    gross_profit: 700,
    net_profit: 500,
    headcount: 10,
    payroll_cost: 200,
    ...overrides,
  };
}

describe("★ Consolidated Revenue", () => {
  it("sums revenue across all units", () => {
    const monthlyRows = [
      monthly({ business_unit: "HajjUmrah", revenue: 5000 }),
      monthly({ business_unit: "Hotel", revenue: 3000 }),
      monthly({ business_unit: "Bakery", revenue: 2000 }),
    ];
    expect(consolidatedRevenue(monthlyRows)).toBe(10000);
  });
});

describe("★ Consolidated Net Profit & Margin", () => {
  it("computes SUM(net_profit) and margin = net_profit / revenue", () => {
    const monthlyRows = [
      monthly({ business_unit: "HajjUmrah", revenue: 5000, net_profit: 1000 }),
      monthly({ business_unit: "Hotel", revenue: 5000, net_profit: 1000 }),
    ];
    const result = consolidatedNetProfitMargin(monthlyRows);
    expect(result.netProfit).toBe(2000);
    expect(result.margin).toBeCloseTo(0.2);
  });
});

describe("★ Cash Position", () => {
  it("computes a running balance from opening balance + cumulative net profit minus group overhead", () => {
    const monthlyRows = [
      monthly({ month: "2025-01", business_unit: "Hotel", net_profit: 100 }),
      monthly({ month: "2025-02", business_unit: "Hotel", net_profit: 200 }),
    ];
    const overhead: RawExpense[] = [
      { date: "2025-01-15", business_unit: "Group", category: "Admin", amount: 30, description: "" },
    ];
    const series = cashPositionSeries(monthlyRows, overhead, 1000);
    expect(series).toEqual([
      { month: "2025-01", netCashFlow: 70, balance: 1070 },
      { month: "2025-02", netCashFlow: 200, balance: 1270 },
    ]);
  });
});

describe("★ Group Headcount & Payroll Cost %", () => {
  it("sums headcount and computes payroll_cost / revenue", () => {
    const monthlyRows = [
      monthly({ business_unit: "HajjUmrah", revenue: 4000, payroll_cost: 400, headcount: 5 }),
      monthly({ business_unit: "Hotel", revenue: 6000, payroll_cost: 600, headcount: 15 }),
    ];
    const result = groupHeadcountAndPayrollPct(monthlyRows);
    expect(result.headcount).toBe(20);
    expect(result.payrollCostPct).toBeCloseTo(1000 / 10000);
  });
});

describe("★ Budget vs Actual Variance", () => {
  it("computes actual - budget from config's flat monthly target", () => {
    const config: KpiConfig = {
      ebitdaAddBackPct: 0.08,
      capitalEmployedByUnit: { HajjUmrah: 1, Hotel: 1, Bakery: 1 },
      openingCashBalance: 0,
      budgetTargetsByUnit: { HajjUmrah: {}, Hotel: { "2025-01": 900 }, Bakery: {} },
      attendancePlaceholderByUnit: { HajjUmrah: 0.95, Hotel: 0.95, Bakery: 0.95 },
    };
    const monthlyRows = [monthly({ month: "2025-01", business_unit: "Hotel", revenue: 1000 })];
    const result = budgetVsActualVariance(monthlyRows, config);
    expect(result).toEqual([
      { month: "2025-01", business_unit: "Hotel", actual: 1000, budget: 900, variance: 100 },
    ]);
  });
});
