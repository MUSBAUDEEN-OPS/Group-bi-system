import { addMonths, monthsBetween } from "@group-bi/kpi-lib";

// The synthetic dataset covers exactly one fiscal year. Anchor "today" to
// its last month so "this month" / "last 3 months" / "YTD" presets are
// meaningful against the data instead of pointing at the real calendar
// (which has no data at all).
export const DATA_EARLIEST_MONTH = "2025-01";
export const DATA_LATEST_MONTH = "2025-12";

export type RangePreset = "this-month" | "last-3-months" | "ytd" | "custom";

export interface ResolvedRange {
  preset: RangePreset;
  startMonth: string;
  endMonth: string;
  months: string[];
  priorPeriodMonths: string[]; // same length, immediately preceding — for MoM-style deltas
}

export function resolveRange(preset: RangePreset, customFrom?: string, customTo?: string): ResolvedRange {
  let startMonth: string;
  let endMonth: string;

  switch (preset) {
    case "this-month":
      startMonth = DATA_LATEST_MONTH;
      endMonth = DATA_LATEST_MONTH;
      break;
    case "last-3-months":
      startMonth = addMonths(DATA_LATEST_MONTH, -2);
      endMonth = DATA_LATEST_MONTH;
      break;
    case "custom":
      startMonth = clampMonth(customFrom ?? DATA_EARLIEST_MONTH);
      endMonth = clampMonth(customTo ?? DATA_LATEST_MONTH);
      if (startMonth > endMonth) [startMonth, endMonth] = [endMonth, startMonth];
      break;
    case "ytd":
    default:
      startMonth = DATA_EARLIEST_MONTH;
      endMonth = DATA_LATEST_MONTH;
      break;
  }

  const months = monthsBetween(startMonth, endMonth);
  const priorStart = addMonths(startMonth, -months.length);
  const priorEnd = addMonths(endMonth, -months.length);
  const priorPeriodMonths = monthsBetween(priorStart, priorEnd).filter((m) => m >= DATA_EARLIEST_MONTH);

  return { preset, startMonth, endMonth, months, priorPeriodMonths };
}

function clampMonth(month: string): string {
  if (month < DATA_EARLIEST_MONTH) return DATA_EARLIEST_MONTH;
  if (month > DATA_LATEST_MONTH) return DATA_LATEST_MONTH;
  return month;
}

export function resolveRangeFromSearchParams(searchParams: Record<string, string | string[] | undefined>): ResolvedRange {
  const rawRange = searchParams.range;
  const preset = (Array.isArray(rawRange) ? rawRange[0] : rawRange) as RangePreset | undefined;
  const rawFrom = searchParams.from;
  const rawTo = searchParams.to;
  const from = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  const to = Array.isArray(rawTo) ? rawTo[0] : rawTo;
  const validPreset: RangePreset = preset && preset in RANGE_PRESET_LABEL ? preset : "ytd";
  return resolveRange(validPreset, from, to);
}

export const RANGE_PRESET_LABEL: Record<RangePreset, string> = {
  "this-month": "This month",
  "last-3-months": "Last 3 months",
  ytd: "Year to date",
  custom: "Custom range",
};
