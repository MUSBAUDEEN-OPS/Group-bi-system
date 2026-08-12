import { formatCompactCurrency, formatCompactNumber, formatPercent } from "./format";

// Client Components can't receive function props from a Server Component
// (they aren't serializable across the RSC boundary), so chart components
// take a format *kind* string instead and resolve it to a formatter locally.
export type FormatKind = "currency" | "number" | "percent" | "rawNumber";

export function resolveFormatter(kind: FormatKind = "number"): (v: number) => string {
  switch (kind) {
    case "currency":
      return formatCompactCurrency;
    case "percent":
      return (v: number) => formatPercent(v);
    case "rawNumber":
      return (v: number) => v.toLocaleString();
    case "number":
    default:
      return formatCompactNumber;
  }
}
