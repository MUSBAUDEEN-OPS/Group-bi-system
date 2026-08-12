import { faker } from "@faker-js/faker";
import type { BusinessUnit, RawPayroll, ReferenceEmployee } from "@group-bi/kpi-lib";
import type { Rng } from "../rng.js";
import { FISCAL_YEAR_END, FISCAL_YEAR_START, VOLUME } from "../config.js";
import { monthOf } from "../dates.js";

const UNIT_DEPARTMENTS: Record<BusinessUnit, string[]> = {
  HajjUmrah: ["Sales", "Operations", "Visa Processing", "Customer Service"],
  Hotel: ["Front Desk", "Housekeeping", "F&B", "Maintenance", "Management"],
  Bakery: ["Production", "Retail/Sales", "Delivery", "Management"],
};

const ROLE_BY_DEPARTMENT_TIER: Record<string, { role: string; baseSalary: [number, number] }[]> = {
  default: [
    { role: "Staff", baseSalary: [70_000, 120_000] },
    { role: "Supervisor", baseSalary: [120_000, 200_000] },
    { role: "Manager", baseSalary: [200_000, 350_000] },
  ],
};

const UNIT_SHARE: Record<BusinessUnit, number> = { HajjUmrah: 0.25, Hotel: 0.45, Bakery: 0.3 };

function pickRole(rng: Rng): { role: string; baseSalary: [number, number] } {
  const tiers = ROLE_BY_DEPARTMENT_TIER.default;
  const roll = rng.next();
  if (roll < 0.75) return tiers[0];
  if (roll < 0.95) return tiers[1];
  return tiers[2];
}

export function generateEmployees(rng: Rng): ReferenceEmployee[] {
  const employees: ReferenceEmployee[] = [];
  let counter = 1;
  const units: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];

  for (const unit of units) {
    const count = Math.round(VOLUME.hr.employeeCount * UNIT_SHARE[unit]);
    for (let i = 0; i < count; i++) {
      const department = rng.pick(UNIT_DEPARTMENTS[unit]);
      // Most staff predate the fiscal year; a few join during it (growth).
      const hireDate = rng.bool(0.85)
        ? faker.date.between({ from: "2019-01-01", to: "2024-12-31" }).toISOString().slice(0, 10)
        : faker.date.between({ from: FISCAL_YEAR_START, to: "2025-10-31" }).toISOString().slice(0, 10);

      let terminationDate: string | null = null;
      if (hireDate < FISCAL_YEAR_END) {
        // Roll month-by-month termination risk across the fiscal year.
        for (let m = 1; m <= 12; m++) {
          const month = `2025-${String(m).padStart(2, "0")}`;
          if (month < monthOf(hireDate)) continue;
          if (rng.bool(VOLUME.hr.monthlyTerminationProbability)) {
            terminationDate = `${month}-${String(rng.int(1, 28)).padStart(2, "0")}`;
            break;
          }
        }
      }

      employees.push({
        employee_id: `EMP${String(counter++).padStart(4, "0")}`,
        name: faker.person.fullName(),
        business_unit: unit,
        department,
        role: pickRole(rng).role,
        hire_date: hireDate,
        termination_date: terminationDate,
      });
    }
  }

  return employees;
}

function baseSalaryForRole(role: string, rng: Rng): number {
  const tiers = ROLE_BY_DEPARTMENT_TIER.default;
  const tier = tiers.find((t) => t.role === role) ?? tiers[0];
  return Math.round(rng.float(tier.baseSalary[0], tier.baseSalary[1]));
}

export function generatePayroll(rng: Rng, employees: ReferenceEmployee[]): RawPayroll[] {
  const payroll: RawPayroll[] = [];
  const salaryByEmployee = new Map(employees.map((e) => [e.employee_id, baseSalaryForRole(e.role, rng)]));

  for (let m = 1; m <= 12; m++) {
    const month = `2025-${String(m).padStart(2, "0")}`;
    const monthEnd = `${month}-31`;
    const monthStart = `${month}-01`;
    for (const e of employees) {
      const active = e.hire_date <= monthEnd && (e.termination_date === null || e.termination_date >= monthStart);
      if (!active) continue;

      const overtimeHours = rng.bool(0.4) ? rng.int(2, 20) : 0;
      const baseSalary = salaryByEmployee.get(e.employee_id)!;
      const hourlyRate = baseSalary / 173; // ~40hr/week average
      const overtimePay = Math.round(overtimeHours * hourlyRate * 1.5);
      const bonus = m === 12 ? Math.round(baseSalary * rng.float(0.3, 0.6)) : rng.bool(0.05) ? Math.round(baseSalary * 0.1) : 0;

      payroll.push({
        month,
        employee_id: e.employee_id,
        business_unit: e.business_unit,
        department: e.department,
        base_salary: baseSalary,
        overtime_hours: overtimeHours,
        overtime_pay: overtimePay,
        bonus,
      });
    }
  }

  return payroll;
}
