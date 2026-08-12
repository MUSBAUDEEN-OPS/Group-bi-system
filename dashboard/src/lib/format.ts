import { currencySymbol, type Currency } from "./currency";

const compactNumber = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });
const fullNumber = new Intl.NumberFormat("en-NG");
// SAR amounts are much smaller in magnitude than NGN (~362 NGN per SAR), so
// they read better with a couple of decimal places instead of rounding to
// a whole unit the way NGN figures do.
const fullNumberSar = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 2 });

export function formatCompactCurrency(value: number, currency: Currency = "NGN"): string {
  return `${currencySymbol(currency)}${compactNumber.format(value)}`;
}

export function formatCurrency(value: number, currency: Currency = "NGN"): string {
  const formatted = currency === "SAR" ? fullNumberSar.format(value) : fullNumber.format(Math.round(value));
  return `${currencySymbol(currency)}${formatted}`;
}

export function formatCompactNumber(value: number): string {
  return compactNumber.format(value);
}

export function formatNumber(value: number): string {
  return fullNumber.format(Math.round(value));
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatSignedPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

// numberingSystem: "latn" keeps digits in Western form even under the
// Arabic locale, matching the rest of the UI (currency/KPI figures stay
// Western-numeral throughout — only the text translates).
export function monthLabel(month: string, lang: "en" | "ar" = "en"): string {
  const [y, m] = month.split("-").map(Number);
  const locale = lang === "ar" ? "ar-u-nu-latn" : "en-US";
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, { month: "short", year: "numeric", timeZone: "UTC" });
}

export function monthLabelShort(month: string, lang: "en" | "ar" = "en"): string {
  const [y, m] = month.split("-").map(Number);
  const locale = lang === "ar" ? "ar-u-nu-latn" : "en-US";
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(locale, { month: "short", timeZone: "UTC" });
}
