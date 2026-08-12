export interface ExchangeRateInfo {
  /** SAR per 1 NGN */
  rate: number;
  asOf: string;
  source: "live" | "fallback";
}

// Approximate NGN->SAR rate (SAR is USD-pegged at 3.75; NGN/USD varies —
// this reflects the official window in mid-2025 as an order-of-magnitude
// fallback only). Superseded by the live rate whenever the fetch succeeds.
const FALLBACK_RATE = 0.0024;
const FALLBACK_INFO: ExchangeRateInfo = { rate: FALLBACK_RATE, asOf: "static fallback", source: "fallback" };

const EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/NGN";

interface OpenErApiResponse {
  result: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

export async function getExchangeRate(): Promise<ExchangeRateInfo> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(EXCHANGE_RATE_URL, {
      next: { revalidate: 3600 },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return FALLBACK_INFO;
    const data = (await res.json()) as OpenErApiResponse;
    const rate = data?.rates?.SAR;
    if (data?.result !== "success" || typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      return FALLBACK_INFO;
    }
    return { rate, asOf: data.time_last_update_utc, source: "live" };
  } catch {
    return FALLBACK_INFO;
  }
}
