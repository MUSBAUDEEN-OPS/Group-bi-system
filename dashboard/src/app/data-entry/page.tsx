import Link from "next/link";
import { resolveLangFromSearchParams } from "@/lib/i18n/resolveLang";
import { translations } from "@/lib/i18n/translations";
import { unitLabel } from "@/lib/chartColors";
import { DATA_ENTRY_LINKS, LEDGER_ENTRY_FORMS_GUIDE_URL, type DataEntryUnit } from "@/data/dataEntryLinks";

const UNIT_ORDER: DataEntryUnit[] = ["HajjUmrah", "Hotel", "Bakery", "Group"];

export default async function DataEntryPage({ searchParams }: PageProps<"/data-entry">) {
  const resolvedSearchParams = await searchParams;
  const lang = resolveLangFromSearchParams(resolvedSearchParams);
  const t = translations[lang];
  const unitHeading = (unit: DataEntryUnit) => (unit === "Group" ? t.dataEntry.groupUnitLabel : unitLabel(unit, lang));

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">{t.dataEntry.pageTitle}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">{t.dataEntry.pageSubtitle}</p>
      </div>

      {UNIT_ORDER.map((unit) => {
        const items = DATA_ENTRY_LINKS.filter((l) => l.unit === unit);
        if (items.length === 0) return null;
        return (
          <section key={unit} aria-label={unitHeading(unit)} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-secondary)]">{unitHeading(unit)}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const title = lang === "ar" ? item.titleAr : item.titleEn;
                const filledBy = lang === "ar" ? item.filledByAr : item.filledByEn;
                return (
                  <div key={item.table} className="flex h-full flex-col justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">{title}</div>
                      <div className="mt-1 text-xs text-[var(--text-muted)]">{filledBy}</div>
                    </div>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 items-center justify-center rounded-full bg-[var(--brand-navy)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-navy-ink)]"
                      >
                        {t.dataEntry.openForm}
                      </a>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="flex min-h-11 items-center justify-center rounded-full border border-dashed border-[var(--border)] px-4 text-sm text-[var(--text-muted)]">
                          {t.dataEntry.notSetUp}
                        </span>
                        <span className="text-center text-xs text-[var(--text-muted)]">{t.dataEntry.setupGuideHint}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <a href={LEDGER_ENTRY_FORMS_GUIDE_URL} target="_blank" rel="noopener noreferrer" className="mt-2 text-sm text-[var(--brand-gold-ink)] hover:underline">
        {t.dataEntry.setupGuideLinkText} →
      </a>
    </div>
  );
}
