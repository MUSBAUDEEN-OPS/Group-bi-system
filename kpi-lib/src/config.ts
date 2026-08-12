import type { BusinessUnit } from "./types.js";

// Parameters the KPI layer needs but cannot derive from raw data alone —
// supplied by the data generator's config today, and eventually by real
// finance/ops config once this points at live Google Sheets.
export interface KpiConfig {
  /** Flat EBITDA add-back, as a fraction of revenue (brief §5 assumption: 8%). */
  ebitdaAddBackPct: number;
  /** Seeded "capital employed" per unit, used for ROI. */
  capitalEmployedByUnit: Record<BusinessUnit, number>;
  /** Opening cash balance the running Cash Position starts from. */
  openingCashBalance: number;
  /** Flat monthly budget target per unit per month (YYYY-MM -> amount). */
  budgetTargetsByUnit: Record<BusinessUnit, Record<string, number>>;
  /** Placeholder attendance/punctuality rate per unit (0-1), pending real attendance data. */
  attendancePlaceholderByUnit: Record<BusinessUnit, number>;
}
