import { describe, expect, it } from "vitest";
import { headcountByUnitDepartment, payrollCostPctRevenue } from "./workforce.js";
import type { RawPayroll, ReferenceEmployee } from "./types.js";

describe("★ Headcount by Unit/Department", () => {
  it("counts active employees (termination_date null or in future) grouped by unit/department", () => {
    const employees: ReferenceEmployee[] = [
      { employee_id: "E1", name: "A", business_unit: "Hotel", department: "FrontDesk", role: "Clerk", hire_date: "2024-01-01", termination_date: null },
      { employee_id: "E2", name: "B", business_unit: "Hotel", department: "FrontDesk", role: "Clerk", hire_date: "2024-01-01", termination_date: "2025-06-01" }, // terminated before asOf
      { employee_id: "E3", name: "C", business_unit: "Bakery", department: "Production", role: "Baker", hire_date: "2024-01-01", termination_date: null },
      { employee_id: "E4", name: "D", business_unit: "Hotel", department: "FrontDesk", role: "Clerk", hire_date: "2025-08-01", termination_date: null }, // hired after asOf
    ];
    const result = headcountByUnitDepartment(employees, "2025-07-01");
    expect(result["Hotel::FrontDesk"]).toBe(1);
    expect(result["Bakery::Production"]).toBe(1);
  });
});

describe("★ Payroll Cost as % of Revenue", () => {
  it("computes SUM(base_salary + overtime_pay + bonus) / revenue, per unit", () => {
    const payroll: RawPayroll[] = [
      { month: "2025-01", employee_id: "E1", business_unit: "Hotel", department: "FrontDesk", base_salary: 1000, overtime_hours: 0, overtime_pay: 100, bonus: 50 },
      { month: "2025-01", employee_id: "E2", business_unit: "Bakery", department: "Production", base_salary: 500, overtime_hours: 0, overtime_pay: 0, bonus: 0 },
    ];
    const revenueByUnit = { HajjUmrah: 0, Hotel: 5000, Bakery: 2500 };
    const result = payrollCostPctRevenue(payroll, revenueByUnit);
    expect(result.Hotel).toBeCloseTo(1150 / 5000);
    expect(result.Bakery).toBeCloseTo(500 / 2500);
  });
});
