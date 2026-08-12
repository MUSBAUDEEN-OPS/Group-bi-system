"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ExportPdfButton } from "./ExportPdfButton";

const NAV_ITEMS = [
  { href: "/", label: "Group Overview" },
  { href: "/hajj-umrah", label: "Hajj & Umrah" },
  { href: "/hotel", label: "Hotel" },
  { href: "/bakery", label: "Bakery" },
  { href: "/workforce", label: "Workforce" },
];

export function NavHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <header className="no-print sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--brand-navy)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-sm font-semibold tracking-tight text-white sm:text-base">
          Group BI <span className="text-[var(--brand-gold)]">Dashboard</span>
        </Link>
        <ExportPdfButton />
      </div>
      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2 text-sm">
        {NAV_ITEMS.map((item) => {
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
