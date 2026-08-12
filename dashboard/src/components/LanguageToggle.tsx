"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Lang } from "@/lib/i18n/translations";

const LANGS: Array<{ value: Lang; label: string }> = [
  { value: "en", label: "EN" },
  { value: "ar", label: "AR" },
];

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";

  function setLang(lang: Lang) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", lang);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print flex gap-2 rounded-full border border-white/20 p-1">
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLang(l.value)}
          className={`flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors ${
            currentLang === l.value ? "bg-[var(--brand-gold)] text-[var(--brand-navy-ink)]" : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          aria-pressed={currentLang === l.value}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
