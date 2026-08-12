"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Currency } from "@/lib/currency";
import type { ExchangeRateInfo } from "@/data/exchangeRate";

const CURRENCIES: Currency[] = ["NGN", "SAR"];

const RATE_NOTE = {
  en: (info: ExchangeRateInfo) =>
    info.source === "live" ? `1 NGN ≈ ${info.rate.toFixed(4)} SAR — live rate` : `1 NGN ≈ ${info.rate.toFixed(4)} SAR — fallback rate (offline)`,
  ar: (info: ExchangeRateInfo) =>
    info.source === "live" ? `١ نايرا ≈ ${info.rate.toFixed(4)} ريال — سعر مباشر` : `١ نايرا ≈ ${info.rate.toFixed(4)} ريال — سعر احتياطي (غير متصل)`,
};

export function CurrencyToggle({ currentCurrency, rateInfo, lang = "en" }: { currentCurrency: Currency; rateInfo?: ExchangeRateInfo; lang?: "en" | "ar" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setCurrency(currency: Currency) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("currency", currency);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <div className="flex gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
        {CURRENCIES.map((currency) => (
          <button
            key={currency}
            type="button"
            onClick={() => setCurrency(currency)}
            className={`flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
              currentCurrency === currency ? "bg-[var(--brand-navy)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--background)]"
            }`}
            aria-pressed={currentCurrency === currency}
          >
            {currency === "NGN" ? "₦ NGN" : "SAR"}
          </button>
        ))}
      </div>
      {currentCurrency === "SAR" && rateInfo && <span className="text-xs text-[var(--text-muted)]">{RATE_NOTE[lang](rateInfo)}</span>}
    </div>
  );
}
