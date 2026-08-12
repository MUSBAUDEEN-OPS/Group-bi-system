const compactNumber = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });
const fullNumber = new Intl.NumberFormat("en-NG");

export function formatCompactCurrency(value: number): string {
  return `₦${compactNumber.format(value)}`;
}

export function formatCurrency(value: number): string {
  return `₦${fullNumber.format(Math.round(value))}`;
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

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function monthLabelShort(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}
