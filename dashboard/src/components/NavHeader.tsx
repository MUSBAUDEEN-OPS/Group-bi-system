"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { translations, type Lang } from "@/lib/i18n/translations";
import { ExportPdfButton } from "./ExportPdfButton";
import { LanguageToggle } from "./LanguageToggle";

export function NavHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const lang: Lang = searchParams.get("lang") === "ar" ? "ar" : "en";
  const t = translations[lang].nav;

  const navItems = [
    { href: "/", label: t.groupOverview },
    { href: "/hajj-umrah", label: t.hajjUmrah },
    { href: "/hotel", label: t.hotel },
    { href: "/bakery", label: t.bakery },
    { href: "/workforce", label: t.workforce },
  ];

  return (
    <header className="no-print sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--brand-navy)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={query ? `/?${query}` : "/"} className="min-w-0 shrink text-sm font-semibold tracking-tight text-white sm:text-base">
          <span className="block truncate">{t.brandName}</span>
          <span className="block truncate text-xs font-normal text-[var(--brand-gold)] sm:text-sm">{t.dashboardSuffix}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <ExportPdfButton label={t.exportPdf} />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2 text-sm">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={query ? `${item.href}?${query}` : item.href}
              className={`flex min-h-11 shrink-0 items-center rounded-full px-4 font-medium transition-colors ${
                active ? "bg-[var(--brand-gold)] text-[var(--brand-navy-ink)]" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
