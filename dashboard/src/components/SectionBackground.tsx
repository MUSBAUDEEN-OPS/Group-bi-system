export type SectionVariant = "group" | "hajjUmrah" | "hotel" | "bakery" | "workforce";

const VARIANT_CLASS: Record<SectionVariant, string> = {
  group: "section-bg--group",
  hajjUmrah: "section-bg--hajj-umrah",
  hotel: "section-bg--hotel",
  bakery: "section-bg--bakery",
  workforce: "section-bg--workforce",
};

// Purely decorative — no data, so aria-hidden and excluded from print.
// Pure CSS (see globals.css): a slow rotating gradient, no JS/canvas/images.
export function SectionBackground({ variant }: { variant: SectionVariant }) {
  return (
    <div className="section-bg-wrap no-print" aria-hidden="true">
      <div className={`section-bg ${VARIANT_CLASS[variant]}`} />
    </div>
  );
}
