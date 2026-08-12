"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DATA_EARLIEST_MONTH, DATA_LATEST_MONTH, type RangePreset } from "@/lib/dateRange";
import { translations, type Lang } from "@/lib/i18n/translations";

const PRESETS: RangePreset[] = ["this-month", "last-3-months", "ytd"];

export function DateRangeFilter({ currentPreset, from, to }: { currentPreset: RangePreset; from?: string; to?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = translations[lang].filters;
  const presetLabel: Record<RangePreset, string> = {
    "this-month": t.thisMonth,
    "last-3-months": t.last3Months,
    ytd: t.yearToDate,
    custom: t.custom,
  };

  function setPreset(preset: RangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", preset);
    if (preset !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function setCustom(field: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set(field, value);
    if (field === "from" && !params.get("to")) params.set("to", DATA_LATEST_MONTH);
    if (field === "to" && !params.get("from")) params.set("from", DATA_EARLIEST_MONTH);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setPreset(preset)}
            className={`flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
              currentPreset === preset
                ? "bg-[var(--brand-navy)] text-white"
                : "text-[var(--text-secondary)] hover:bg-[var(--background)]"
            }`}
            aria-pressed={currentPreset === preset}
          >
            {presetLabel[preset]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPreset("custom")}
          className={`flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
            currentPreset === "custom" ? "bg-[var(--brand-navy)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--background)]"
          }`}
          aria-pressed={currentPreset === "custom"}
        >
          {t.custom}
        </button>
      </div>
      {currentPreset === "custom" && (
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1 text-[var(--text-secondary)]">
            {t.from}
            <input
              type="month"
              value={from ?? DATA_EARLIEST_MONTH}
              min={DATA_EARLIEST_MONTH}
              max={DATA_LATEST_MONTH}
              onChange={(e) => setCustom("from", e.target.value)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2"
            />
          </label>
          <label className="flex items-center gap-1 text-[var(--text-secondary)]">
            {t.to}
            <input
              type="month"
              value={to ?? DATA_LATEST_MONTH}
              min={DATA_EARLIEST_MONTH}
              max={DATA_LATEST_MONTH}
              onChange={(e) => setCustom("to", e.target.value)}
              className="min-h-11 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2"
            />
          </label>
        </div>
      )}
    </div>
  );
}
