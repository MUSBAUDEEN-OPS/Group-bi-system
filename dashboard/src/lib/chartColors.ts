import type { BusinessUnit } from "@group-bi/kpi-lib";
import { translations, type Lang } from "./i18n/translations";

// CSS custom properties (defined in globals.css) referenced directly as SVG
// fill/stroke values — this keeps every chart theme-aware (light/dark) for
// free, without re-rendering on theme change.
export const SERIES_COLOR: Record<BusinessUnit, string> = {
  HajjUmrah: "var(--series-hajj-umrah)",
  Hotel: "var(--series-hotel)",
  Bakery: "var(--series-bakery)",
};

// English-only fallback map, kept for any call site that hasn't threaded a
// `lang` through yet. Prefer unitLabel(unit, lang) in new code.
export const UNIT_LABEL: Record<BusinessUnit, string> = {
  HajjUmrah: "Hajj & Umrah",
  Hotel: "Hotel",
  Bakery: "Bakery",
};

export function unitLabel(unit: BusinessUnit, lang: Lang = "en"): string {
  return translations[lang].units[unit];
}

export const STATUS_COLOR = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
} as const;

export function trendColor(delta: number, upIsGood = true): string {
  if (delta === 0) return "var(--text-muted)";
  const isUp = delta > 0;
  const good = upIsGood ? isUp : !isUp;
  return good ? "var(--status-good-text)" : "var(--status-critical)";
}
