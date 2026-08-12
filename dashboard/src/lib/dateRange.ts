import { addMonths, monthsBetween } from "@group-bi/kpi-lib";

export interface DataBounds {
  earliestMonth: string;
  latestMonth: string;
}

// Derives the selectable month window from whatever the active DataSource
// actually returned (any array of rows with a `month` field works — pages
// already have one in hand from their first fetch, so this needs no extra
// request). Falls back to the real current month when there's no data at
// all yet (e.g. a freshly connected, still-empty Google Sheet).
export function deriveDataBounds(rows: Array<{ month: string }>): DataBounds {
  if (rows.length === 0) {
    const now = new Date().toISOString().slice(0, 7);
    return { earliestMonth: now, latestMonth: now };
  }
  const months = [...new Set(rows.map((r) => r.month))].sort();
  return { earliestMonth: months[0], latestMonth: months[months.length - 1] };
}

// "Today" for range purposes: the real current month when the data is
// actually current enough to include it, otherwise the latest month that
// has data. This makes "this month"/"YTD" track the real calendar once
// data entry is live and current, while still behaving sensibly against
// the fixed-year demo dataset (whose "latest month" is never the real
// current month) or against real data that's a few days behind on entry.
function resolveToday(bounds: DataBounds): string {
  const now = new Date().toISOString().slice(0, 7);
  if (now >= bounds.earliestMonth && now <= bounds.latestMonth) return now;
  return bounds.latestMonth;
}

export type RangePreset = "this-month" | "last-3-months" | "ytd" | "custom";

export interface ResolvedRange {
  preset: RangePreset;
  startMonth: string;
  endMonth: string;
  months: string[];
  priorPeriodMonths: string[]; // same length, immediately preceding — for MoM-style deltas
  bounds: DataBounds;
}

export function resolveRange(preset: RangePreset, bounds: DataBounds, customFrom?: string, customTo?: string): ResolvedRange {
  const today = resolveToday(bounds);
  let startMonth: string;
  let endMonth: string;

  switch (preset) {
    case "this-month":
      startMonth = today;
      endMonth = today;
      break;
    case "last-3-months":
      startMonth = addMonths(today, -2);
      endMonth = today;
      break;
    case "custom":
      startMonth = clampMonth(customFrom ?? bounds.earliestMonth, bounds);
      endMonth = clampMonth(customTo ?? bounds.latestMonth, bounds);
      if (startMonth > endMonth) [startMonth, endMonth] = [endMonth, startMonth];
      break;
    case "ytd":
    default: {
      // Current calendar year only — not "since the beginning of all
      // recorded history", which matters once data spans multiple years.
      const yearStart = `${today.slice(0, 4)}-01`;
      startMonth = yearStart > bounds.earliestMonth ? yearStart : bounds.earliestMonth;
      endMonth = today;
      break;
    }
  }

  const months = monthsBetween(startMonth, endMonth);
  const priorStart = addMonths(startMonth, -months.length);
  const priorEnd = addMonths(endMonth, -months.length);
  const priorPeriodMonths = monthsBetween(priorStart, priorEnd).filter((m) => m >= bounds.earliestMonth);

  return { preset, startMonth, endMonth, months, priorPeriodMonths, bounds };
}

function clampMonth(month: string, bounds: DataBounds): string {
  if (month < bounds.earliestMonth) return bounds.earliestMonth;
  if (month > bounds.latestMonth) return bounds.latestMonth;
  return month;
}

export function resolveRangeFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
  bounds: DataBounds,
): ResolvedRange {
  const rawRange = searchParams.range;
  const preset = (Array.isArray(rawRange) ? rawRange[0] : rawRange) as RangePreset | undefined;
  const rawFrom = searchParams.from;
  const rawTo = searchParams.to;
  const from = Array.isArray(rawFrom) ? rawFrom[0] : rawFrom;
  const to = Array.isArray(rawTo) ? rawTo[0] : rawTo;
  const validPreset: RangePreset = preset && preset in RANGE_PRESET_LABEL ? preset : "ytd";
  return resolveRange(validPreset, bounds, from, to);
}

export const RANGE_PRESET_LABEL: Record<RangePreset, string> = {
  "this-month": "This month",
  "last-3-months": "Last 3 months",
  ytd: "Year to date",
  custom: "Custom range",
};
