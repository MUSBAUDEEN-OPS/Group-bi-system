import type { KpiConfig } from "@group-bi/kpi-lib";

// ---------------------------------------------------------------------------
// Fiscal year window. The brief asks for "one realistic fiscal year"; we
// generate exactly that (Jan-Dec 2025). There is deliberately no prior-year
// data, so YoY Growth KPIs will correctly report "insufficient history" —
// an outcome the brief explicitly allows in lieu of fabricating a second year.
// ---------------------------------------------------------------------------
export const FISCAL_YEAR_START = "2025-01-01";
export const FISCAL_YEAR_END = "2025-12-31";

export interface DateWindow {
  start: string;
  end: string;
  label: string;
}

// Hijri-calendar events are approximated as fixed Gregorian windows for this
// synthetic year — real dates shift ~11 days/year, which doesn't matter for
// a foundation-phase dataset but should not be assumed accurate for other years.
export const HAJJ_SEASON: DateWindow = { start: "2025-06-02", end: "2025-06-16", label: "Hajj" };

export const UMRAH_HIGH_SEASON_WINDOWS: DateWindow[] = [
  { start: "2025-02-28", end: "2025-03-30", label: "Ramadan" },
  { start: "2025-07-01", end: "2025-08-20", label: "School holidays" },
  { start: "2025-12-10", end: "2025-12-31", label: "Winter holidays" },
];

export const BAKERY_SPIKE_WINDOWS: Array<DateWindow & { multiplier: number }> = [
  { start: "2025-02-28", end: "2025-03-30", multiplier: 1.7, label: "Ramadan" },
  { start: "2025-03-30", end: "2025-04-02", multiplier: 2.2, label: "Eid al-Fitr" },
  { start: "2025-06-05", end: "2025-06-09", multiplier: 2.0, label: "Eid al-Adha" },
];

// Modest month-over-month growth baked into baseline volumes so MoM/YoY
// trend KPIs aren't flat across the year.
export const GROWTH_TREND_MONTHLY = 0.012;

// One deliberately anomalous month per unit, so future anomaly-detection
// work has something real to catch (brief §7).
export const ANOMALY_MONTHS = {
  HajjUmrah: "2025-09", // elevated cancellation/refund rate
  Hotel: "2025-11", // cost spike + occupancy dip
  Bakery: "2025-04", // waste/spoilage spike
} as const;

// ---------------------------------------------------------------------------
// Volume knobs — tuned to land in the "realistic scale" ranges from brief §7.
// ---------------------------------------------------------------------------
export const VOLUME = {
  hajjUmrah: {
    hajjBookingsTarget: 850, // confirmed+other bookings during Hajj season
    umrahBookingsPerOffSeasonDay: 1.1, // baseline outside high-season windows
    umrahHighSeasonMultiplier: 3.2,
    inquiryToBookingRatio: 3.0, // inquiries generated ~= bookings * this
    agentCount: 18,
  },
  hotel: {
    totalRooms: 60,
    baseWeekdayOccupancy: 0.55,
    baseWeekendOccupancy: 0.8,
    seasonalPeakMonths: ["2025-06", "2025-07", "2025-08", "2025-12"],
    seasonalPeakMultiplier: 1.15,
  },
  bakery: {
    outletCount: 4,
    productCount: 14,
    baseDailyTransactionsPerOutlet: 28,
  },
  hr: {
    employeeCount: 140,
    monthlyTerminationProbability: 0.01,
  },
} as const;

// ---------------------------------------------------------------------------
// KPI config (finance placeholders the KPI layer needs but can't derive from
// raw data alone — see kpi-lib/src/config.ts for the shape/rationale).
// ---------------------------------------------------------------------------
export const KPI_CONFIG: KpiConfig = {
  ebitdaAddBackPct: 0.08,
  capitalEmployedByUnit: {
    HajjUmrah: 4_000_000,
    Hotel: 12_000_000,
    Bakery: 1_500_000,
  },
  openingCashBalance: 5_000_000,
  // Flat monthly budget targets, filled in generate.ts once baseline revenue
  // is known (prior-year x growth assumption — no prior year exists, so we
  // seed a flat target derived from the unit's average monthly revenue).
  budgetTargetsByUnit: { HajjUmrah: {}, Hotel: {}, Bakery: {} },
  attendancePlaceholderByUnit: {
    HajjUmrah: 0.96,
    Hotel: 0.94,
    Bakery: 0.93,
  },
};
