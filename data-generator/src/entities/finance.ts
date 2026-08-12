import { OPEX_CATEGORY_NAMES, type BusinessUnit, type RawExpense } from "@group-bi/kpi-lib";
import type { Rng } from "../rng.js";
import { ANOMALY_MONTHS } from "../config.js";

const OPEX_CATEGORIES = OPEX_CATEGORY_NAMES;

// OpEx per category as a fraction of that unit's revenue that month, plus a
// fixed monthly floor (rent/utilities don't drop to zero in a slow month).
// Expressed as a rate rather than a flat naira figure so it scales
// consistently regardless of a business unit's absolute price level.
const OPEX_RATE: Record<BusinessUnit, Record<(typeof OPEX_CATEGORIES)[number], number>> = {
  HajjUmrah: { Marketing: 0.02, Utilities: 0.004, Maintenance: 0.003, "Rent & Facilities": 0.012 },
  Hotel: { Marketing: 0.03, Utilities: 0.06, Maintenance: 0.03, "Rent & Facilities": 0.05 },
  Bakery: { Marketing: 0.02, Utilities: 0.025, Maintenance: 0.015, "Rent & Facilities": 0.03 },
};
const OPEX_FLOOR: Record<BusinessUnit, Record<(typeof OPEX_CATEGORIES)[number], number>> = {
  HajjUmrah: { Marketing: 300_000, Utilities: 80_000, Maintenance: 60_000, "Rent & Facilities": 400_000 },
  Hotel: { Marketing: 200_000, Utilities: 500_000, Maintenance: 250_000, "Rent & Facilities": 450_000 },
  Bakery: { Marketing: 120_000, Utilities: 180_000, Maintenance: 100_000, "Rent & Facilities": 280_000 },
};

const HAJJ_UMRAH_COGS_RATIO = 0.6; // package delivery cost as a fraction of package revenue
const HOTEL_FNB_COGS_RATIO = 0.32; // F&B cost of goods as a fraction of F&B revenue
const GROUP_OVERHEAD_MONTHLY = 900_000;

function monthDate(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

export function generateExpenses(
  rng: Rng,
  monthlyRevenueByUnit: Record<BusinessUnit, Record<string, number>>,
  monthlyHotelFnbRevenue: Record<string, number>,
): RawExpense[] {
  const expenses: RawExpense[] = [];
  const units: BusinessUnit[] = ["HajjUmrah", "Hotel", "Bakery"];

  for (let m = 1; m <= 12; m++) {
    const month = `2025-${String(m).padStart(2, "0")}`;

    for (const unit of units) {
      const anomalous = ANOMALY_MONTHS[unit] === month;
      const revenue = monthlyRevenueByUnit[unit][month] ?? 0;

      for (const category of OPEX_CATEGORIES) {
        const rateBased = revenue * OPEX_RATE[unit][category];
        const floor = OPEX_FLOOR[unit][category];
        const spike = anomalous && category === "Maintenance" ? rng.float(1.8, 2.6) : 1;
        expenses.push({
          date: monthDate(month, rng.int(1, 27)),
          business_unit: unit,
          category,
          amount: Math.round(Math.max(rateBased, floor) * rng.float(0.85, 1.15) * spike),
          description: `${category} — ${unit} — ${month}`,
        });
      }

      if (unit === "HajjUmrah") {
        const revenue = monthlyRevenueByUnit.HajjUmrah[month] ?? 0;
        expenses.push({
          date: monthDate(month, rng.int(1, 27)),
          business_unit: unit,
          category: "Package Delivery Costs",
          amount: Math.round(revenue * HAJJ_UMRAH_COGS_RATIO * rng.float(0.95, 1.08)),
          description: `Overseas hotel/transport costs — ${month}`,
        });
      }

      if (unit === "Hotel") {
        const fnbRevenue = monthlyHotelFnbRevenue[month] ?? 0;
        expenses.push({
          date: monthDate(month, rng.int(1, 27)),
          business_unit: unit,
          category: "F&B Cost of Goods",
          amount: Math.round(fnbRevenue * HOTEL_FNB_COGS_RATIO * rng.float(0.95, 1.08)),
          description: `F&B cost of goods — ${month}`,
        });
      }
    }

    expenses.push({
      date: monthDate(month, rng.int(1, 27)),
      business_unit: "Group",
      category: "Admin & Corporate Overhead",
      amount: Math.round(GROUP_OVERHEAD_MONTHLY * rng.float(0.9, 1.1)),
      description: `Group corporate overhead — ${month}`,
    });
  }

  return expenses;
}
