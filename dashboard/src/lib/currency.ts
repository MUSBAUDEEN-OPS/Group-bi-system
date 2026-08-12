export type Currency = "NGN" | "SAR";

export function convertFromNGN(ngnAmount: number, currency: Currency, rate: number): number {
  return currency === "SAR" ? ngnAmount * rate : ngnAmount;
}

export function currencySymbol(currency: Currency): string {
  return currency === "SAR" ? "SAR" : "₦";
}

export function isCurrency(value: string | undefined): value is Currency {
  return value === "NGN" || value === "SAR";
}
