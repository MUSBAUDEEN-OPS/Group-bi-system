import { formatCompactCurrency, formatCompactNumber, formatPercent } from "./format";
import { convertFromNGN, type Currency } from "./currency";

// Client Components can't receive function props from a Server Component
// (they aren't serializable across the RSC boundary), so chart components
// take a format *kind* string (plus, for currency, the current currency +
// exchange rate — plain data, which IS serializable) and resolve it to a
// formatter locally.
export type FormatKind = "currency" | "number" | "percent" | "rawNumber";

export interface CurrencyContext {
  currency: Currency;
  rate: number;
}

export function resolveFormatter(kind: FormatKind = "number", currencyContext?: CurrencyContext): (v: number) => string {
  switch (kind) {
    case "currency":
      return (v: number) => {
        const { currency, rate } = currencyContext ?? { currency: "NGN" as Currency, rate: 1 };
        return formatCompactCurrency(convertFromNGN(v, currency, rate), currency);
      };
    case "percent":
      return (v: number) => formatPercent(v);
    case "rawNumber":
      return (v: number) => v.toLocaleString();
    case "number":
    default:
      return formatCompactNumber;
  }
}
