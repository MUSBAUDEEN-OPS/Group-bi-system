import { resolveLangFromSearchParams } from "@/lib/i18n/resolveLang";
import { translations } from "@/lib/i18n/translations";
import { SectionBackground } from "@/components/SectionBackground";

const ACCENT = {
  group: "var(--brand-gold)",
  hajjUmrah: "var(--series-hajj-umrah)",
  hotel: "var(--series-hotel)",
  bakery: "var(--series-bakery)",
  workforce: "var(--brand-navy)",
} as const;

function JumpLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="flex min-h-11 shrink-0 items-center rounded-full border border-[var(--border)] px-3 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-gold)] hover:text-[var(--brand-gold-ink)]"
    >
      {children}
    </a>
  );
}

function Section({
  id,
  accent,
  title,
  subtitle,
  children,
}: {
  id: string;
  accent: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="h-3 w-3 shrink-0 -translate-y-px rounded-sm" style={{ background: accent }} />
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      </div>
      <p className="mb-4 max-w-2xl text-sm text-[var(--text-muted)]">{subtitle}</p>
      {children}
    </section>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] first:mt-0">{children}</h3>;
}

function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function KpiCard({ name, what, headline, accent }: { name: string; what: string; headline?: boolean; accent?: string }) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      style={headline ? { borderInlineStart: `3px solid ${accent ?? ACCENT.group}` } : undefined}
    >
      <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)]">
        {headline && <span style={{ color: "var(--brand-gold)" }}>★</span>}
        {name}
      </div>
      <p className="text-sm text-[var(--text-secondary)]">{what}</p>
    </div>
  );
}

function ChartCard({ type, name, what, accent }: { type: string; name: string; what: React.ReactNode; accent: string }) {
  return (
    <div className="mb-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4">
      <span className="mb-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: accent }}>
        {type}
      </span>
      <div className="mb-1 text-sm font-semibold text-[var(--foreground)]">{name}</div>
      <p className="text-sm text-[var(--text-secondary)]">{what}</p>
    </div>
  );
}

function TableNote({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-secondary)]">{children}</div>;
}

export default async function GuidePage({ searchParams }: PageProps<"/guide">) {
  const resolvedSearchParams = await searchParams;
  const lang = resolveLangFromSearchParams(resolvedSearchParams);
  const t = translations[lang];

  return (
    <div dir="ltr" className="flex flex-col gap-4 pb-8">
      <SectionBackground variant="group" />
      <div>
        <h1 className="text-lg font-semibold text-[var(--foreground)]">{t.guide.pageTitle}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">{t.guide.pageSubtitle}</p>
      </div>

      <nav aria-label="Jump to section" className="flex flex-wrap gap-2">
        <JumpLink href="#howto">How to read it</JumpLink>
        <JumpLink href="#money">Money terms</JumpLink>
        <JumpLink href="#overview">Group Overview</JumpLink>
        <JumpLink href="#hajjumrah">Hajj &amp; Umrah</JumpLink>
        <JumpLink href="#hotel">Hotel</JumpLink>
        <JumpLink href="#bakery">Bakery</JumpLink>
        <JumpLink href="#workforce">Workforce</JumpLink>
      </nav>

      <div className="flex flex-col gap-10">
        <Section id="howto" accent={ACCENT.group} title="How to Read the Dashboard" subtitle="Before the numbers, a few things that show up on every page. Once these click, every screen reads the same way.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <KpiCard name="★ The gold star" what={`Marks the headline numbers — the two to five figures that matter most on that page. Everything else is supporting detail.`} />
            <KpiCard
              name="Arrows and percentages"
              what={`A small arrow and a percentage next to a number compares it to the prior period. Green usually means things moved the right way, red the wrong way — except for Cancellation Rate, Waste Rate, and Staff Turnover, where a drop is the good outcome, so the colours flip.`}
            />
            <KpiCard name="Currency toggle (NGN / SAR)" what="Switches every money figure on the page between Naira and Saudi Riyal at the current exchange rate. Only the display changes." />
            <KpiCard
              name="Date range filter"
              what={`This month / Last 3 months / Year to date / Custom — controls the time window every number and chart on the page reflects.`}
            />
            <KpiCard
              name={`The "placeholder" tag`}
              what={`A few tiles on the Workforce page (Attendance) are marked placeholder — the dashboard isn't yet fed by a real data source for that number, so treat it as illustrative only.`}
            />
            <KpiCard name="Export PDF" what="Top-right of every page. Saves a snapshot of exactly what's on screen as a PDF, for printing or sharing." />
          </div>
          <div className="mt-4 rounded-xl border-l-4 border-[var(--brand-gold)] bg-[var(--background)] p-4 text-sm text-[var(--text-secondary)]">
            The top navigation bar switches between <b>Group Overview</b> (the whole company, combined) and each individual business — <b>Hajj &amp; Umrah</b>, <b>Hotel</b>,{" "}
            <b>Bakery</b> — plus <b>Workforce</b>, which looks at people and payroll across all three.
          </div>
        </Section>

        <Section
          id="money"
          accent={ACCENT.group}
          title="Understanding the Money Terms"
          subtitle={`Every business page ends with a "Monthly summary" table using the same seven columns. Learn these once — they apply everywhere.`}
        >
          <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4">
            {[
              ["Revenue", "All the money that came in from sales or bookings that month, before subtracting any cost."],
              [
                "COGS",
                "Cost of Goods Sold — the direct cost of delivering what was sold: e.g. what a Hajj/Umrah package actually cost to run, or the ingredients that went into what the bakery sold. Doesn't include rent, marketing or other overhead.",
              ],
              ["OpEx", "Operating Expenses — the cost of simply running the business day to day: marketing, utilities, maintenance, rent. These exist whether sales are high or low."],
              ["Gross Profit", "Revenue minus COGS. What's left once the direct cost of the product or service itself is covered."],
              ["Net Profit", "Gross Profit minus OpEx. The true bottom line — what the business actually kept after every cost, direct and overhead."],
              ["Headcount", "Number of people employed in that business that month."],
              ["Payroll Cost", "Total wages, overtime and bonuses paid out that month."],
            ].map(([term, def]) => (
              <div key={term} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                <div className="text-sm font-semibold text-[var(--foreground)]">{term}</div>
                <div className="text-sm text-[var(--text-secondary)]">{def}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 inline-flex flex-wrap items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)]">
            <span>Revenue</span>
            <span className="text-[var(--brand-gold-ink)]">−</span>
            <span>COGS</span>
            <span className="text-[var(--brand-gold-ink)]">=</span>
            <span>Gross Profit</span>
            <span className="mx-1 text-[var(--border)]">|</span>
            <span>Gross Profit</span>
            <span className="text-[var(--brand-gold-ink)]">−</span>
            <span>OpEx</span>
            <span className="text-[var(--brand-gold-ink)]">=</span>
            <span>Net Profit</span>
          </div>
        </Section>

        <Section id="overview" accent={ACCENT.group} title="Group Overview" subtitle="The company-wide snapshot — Hajj & Umrah, Hotel and Bakery combined into one picture.">
          <GroupLabel>Headline numbers</GroupLabel>
          <KpiGrid>
            <KpiCard
              headline
              accent={ACCENT.group}
              name="Consolidated Revenue"
              what="Total money earned across all three businesses combined, for the selected period. Shown with a small trend line of recent months."
            />
            <KpiCard
              headline
              accent={ACCENT.group}
              name="Net Profit"
              what="What's left across the whole group after every cost, direct and overhead. The percentage underneath is the profit margin — net profit as a share of revenue."
            />
            <KpiCard
              headline
              accent={ACCENT.group}
              name="Cash Position"
              what="A running estimate of cash on hand: each month's net profit is added, and group-level overhead (head-office costs not tied to one business) is subtracted, building on an opening balance."
            />
            <KpiCard
              headline
              accent={ACCENT.group}
              name="Group Headcount"
              what="Total people employed across the whole group. The line underneath — payroll cost as a % of revenue — flags whether staffing cost is growing faster than income."
            />
            <KpiCard
              headline
              accent={ACCENT.group}
              name="Budget vs Actual"
              what="How far actual revenue landed from what was budgeted, added up across all three businesses. Positive means the group beat its target; negative means it fell short."
            />
          </KpiGrid>
          <GroupLabel>Business unit cards</GroupLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-t-[3px] border-[var(--border)] bg-[var(--surface)] p-4" style={{ borderTopColor: ACCENT.hajjUmrah }}>
              <div className="mb-1 text-sm font-semibold" style={{ color: ACCENT.hajjUmrah }}>
                Hajj &amp; Umrah
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Revenue for the period and its change vs. the prior period. Click through for the full dashboard.</p>
            </div>
            <div className="rounded-xl border border-t-[3px] border-[var(--border)] bg-[var(--surface)] p-4" style={{ borderTopColor: ACCENT.hotel }}>
              <div className="mb-1 text-sm font-semibold" style={{ color: ACCENT.hotel }}>
                Hotel
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Same view for the Hotel business — revenue and period-over-period change.</p>
            </div>
            <div className="rounded-xl border border-t-[3px] border-[var(--border)] bg-[var(--surface)] p-4" style={{ borderTopColor: ACCENT.bakery }}>
              <div className="mb-1 text-sm font-semibold" style={{ color: ACCENT.bakery }}>
                Bakery
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Same view for the Bakery business — revenue and period-over-period change.</p>
            </div>
          </div>
        </Section>

        <Section id="hajjumrah" accent={ACCENT.hajjUmrah} title="Hajj & Umrah Tourism" subtitle="Pilgrimage packages, bookings and the operations behind moving pilgrims through Hajj and Umrah seasons.">
          <GroupLabel>Headline numbers</GroupLabel>
          <KpiGrid>
            <KpiCard headline accent={ACCENT.hajjUmrah} name="Pilgrims Served" what="Total number of people on confirmed bookings in the period. The split underneath shows how many were Hajj vs. Umrah." />
            <KpiCard headline accent={ACCENT.hajjUmrah} name="Package Revenue" what="Total revenue from package bookings. The chart below breaks it down by tier — Economy, Standard, VIP." />
            <KpiCard
              headline
              accent={ACCENT.hajjUmrah}
              name="Cancellation / Refund Rate"
              what="Share of all bookings that were cancelled or refunded. Lower is better — one of the metrics where a falling number is the good outcome."
            />
            <KpiCard
              headline
              accent={ACCENT.hajjUmrah}
              name="Customer Satisfaction (NPS)"
              what={`A −100 to +100 score built from post-trip surveys. Pilgrims who rate their trip 9–10 count as "promoters"; those who rate 0–6 count as "detractors". The score is the share of promoters minus the share of detractors.`}
            />
          </KpiGrid>
          <GroupLabel>Supporting numbers</GroupLabel>
          <KpiGrid>
            <KpiCard name="Avg Revenue / Pilgrim" what="Package revenue divided by pilgrims served — roughly, how much the business earns per person." />
            <KpiCard name="Booking Conversion Rate" what="Of everyone who inquired about a package, the share that actually booked and confirmed." />
            <KpiCard name="Visa & Permit Cost / Pilgrim" what="Average cost of processing visas and permits, per pilgrim." />
            <KpiCard name="Departure Fill Rate" what="Of all the seats/capacity across departure groups, the share actually filled. Higher means departures run fuller." />
            <KpiCard name="Repeat Customer Rate (YTD)" what="Of everyone who's booked this year, the share who booked more than once — a loyalty signal." />
          </KpiGrid>
          <GroupLabel>Charts</GroupLabel>
          <ChartCard
            type="Line chart"
            accent={ACCENT.hajjUmrah}
            name="Pilgrims Served"
            what="Pilgrims served, month by month, across the year — expect the big seasonal spike around Hajj season (June)."
          />
          <ChartCard type="Bar chart" accent={ACCENT.hajjUmrah} name="Package Revenue by Tier" what="Compares how much revenue came from Economy, Standard, and VIP packages." />
          <TableNote>
            The <b>Monthly summary</b> table at the bottom of this page uses the Revenue / COGS / OpEx / Gross Profit / Net Profit / Headcount / Payroll Cost columns explained in{" "}
            <a href="#money" className="font-semibold text-[var(--brand-gold-ink)] underline">
              Understanding the Money Terms
            </a>
            .
          </TableNote>
        </Section>

        <Section id="hotel" accent={ACCENT.hotel} title="Hotel" subtitle="Room bookings, pricing, and the food & beverage business that runs alongside the rooms.">
          <GroupLabel>Headline numbers</GroupLabel>
          <KpiGrid>
            <KpiCard headline accent={ACCENT.hotel} name="Occupancy Rate" what="Share of available room-nights that were actually sold. The core measure of how full the hotel is running." />
            <KpiCard headline accent={ACCENT.hotel} name="ADR (Average Daily Rate)" what="The average price paid per room, per night, across every room sold. Just the price level — not how full the hotel is." />
            <KpiCard
              headline
              accent={ACCENT.hotel}
              name="RevPAR (Revenue per Available Room)"
              what="ADR × Occupancy Rate. The single best combined measure of hotel performance — it captures both price and how full the hotel is running, in one number."
            />
          </KpiGrid>
          <GroupLabel>Supporting numbers</GroupLabel>
          <KpiGrid>
            <KpiCard name="F&B Revenue / Occupied Room" what="Restaurant and room-service revenue per occupied room-night — how well the hotel sells food & beverage to guests staying there." />
            <KpiCard name="Guest Satisfaction" what="Average guest rating out of 5, from post-stay feedback." />
            <KpiCard name="Average Length of Stay" what="On average, how many nights guests stay per booking." />
          </KpiGrid>
          <GroupLabel>Charts</GroupLabel>
          <ChartCard type="Line chart" accent={ACCENT.hotel} name="Occupancy Rate" what="Occupancy trend across the months in the selected period." />
          <ChartCard
            type="Bar chart"
            accent={ACCENT.hotel}
            name="Direct vs Agent vs OTA bookings"
            what={
              <>
                How bookings split across the three ways guests book: <b>direct</b> (through the hotel itself), <b>agent</b> (a travel agent), or <b>OTA</b> — an online travel
                agency such as Booking.com. Each channel carries a different commission cost; more direct bookings usually means healthier margins.
              </>
            }
          />
          <TableNote>
            The <b>Monthly summary</b> table at the bottom of this page uses the same columns explained in{" "}
            <a href="#money" className="font-semibold text-[var(--brand-gold-ink)] underline">
              Understanding the Money Terms
            </a>
            .
          </TableNote>
        </Section>

        <Section id="bakery" accent={ACCENT.bakery} title="Bakery" subtitle="Production, outlet sales and product-level profitability across the bakery's branches.">
          <GroupLabel>Headline numbers</GroupLabel>
          <KpiGrid>
            <KpiCard headline accent={ACCENT.bakery} name="Production Volume" what="Total units produced (loaves, cakes, packs, etc.) across all products in the period." />
            <KpiCard headline accent={ACCENT.bakery} name="Sales per Outlet" what="Total sales revenue, added up across every outlet — the chart below breaks it down branch by branch." />
            <KpiCard
              headline
              accent={ACCENT.bakery}
              name="Gross Margin per Product"
              what="Average profit margin, as a %, across the top products — after ingredient cost, what share of each sale is profit."
            />
          </KpiGrid>
          <GroupLabel>Supporting numbers</GroupLabel>
          <KpiGrid>
            <KpiCard name="Waste / Spoilage Rate" what="Share of everything produced that was wasted or spoiled rather than sold. Lower is better." />
            <KpiCard name="Average Transaction Value" what="On average, how much a single customer sale is worth." />
          </KpiGrid>
          <GroupLabel>Charts</GroupLabel>
          <ChartCard type="Line chart" accent={ACCENT.bakery} name="Production Volume" what="Monthly production volume — watch for spikes around Ramadan and Eid, when demand rises sharply." />
          <ChartCard type="Bar chart" accent={ACCENT.bakery} name="Sales per Outlet" what="Revenue generated by each individual outlet, side by side." />
          <ChartCard type="Bar chart" accent={ACCENT.bakery} name="Gross Margin per Product (top 8)" what="Which of the top 8 products are the most profitable per unit sold, expressed as a % margin." />
          <ChartCard type="Bar chart" accent={ACCENT.bakery} name="Top-Selling Products by Revenue" what="Which products bring in the most total money, regardless of margin." />
          <TableNote>
            The <b>Monthly summary</b> table at the bottom of this page uses the same columns explained in{" "}
            <a href="#money" className="font-semibold text-[var(--brand-gold-ink)] underline">
              Understanding the Money Terms
            </a>
            .
          </TableNote>
        </Section>

        <Section id="workforce" accent={ACCENT.workforce} title="Workforce" subtitle="People and payroll, viewed across all three businesses at once.">
          <GroupLabel>Headline numbers</GroupLabel>
          <KpiGrid>
            <KpiCard headline accent={ACCENT.workforce} name="Group Headcount" what="The same total-people figure shown on Group Overview — everyone employed across the whole group." />
            <KpiCard
              headline
              accent={ACCENT.workforce}
              name="Payroll Cost % — per business"
              what="For each business, what share of its revenue goes to paying its staff — a rough gauge of how labour-heavy each business is relative to what it earns."
            />
          </KpiGrid>
          <GroupLabel>Supporting numbers</GroupLabel>
          <KpiGrid>
            <KpiCard
              name="Staff Turnover Rate"
              what="Share of the workforce that left during the period, relative to average headcount. Lower is healthier — high turnover means constant re-hiring."
            />
            <KpiCard name="Overtime Hours" what="Total overtime hours logged across the group in the period." />
            <KpiCard name="Overtime Cost" what="Total amount paid out for that overtime." />
            <KpiCard
              name="Attendance — per business (placeholder)"
              what="Attendance/punctuality per business. Currently a placeholder — not yet fed by a real attendance data source, so treat these as illustrative only."
            />
            <KpiCard
              name="Revenue / Employee — per business"
              what="For each business, how much revenue is generated per employee — a rough measure of workforce efficiency."
            />
          </KpiGrid>
          <GroupLabel>Table</GroupLabel>
          <TableNote>
            <b>Headcount by unit / department</b> — a snapshot, as of the most recent month in the selected period, of exactly how many people work in each department of each
            business. This is the detailed breakdown behind the Group Headcount number above.
          </TableNote>
        </Section>
      </div>

      <p className="mt-2 max-w-2xl text-xs text-[var(--text-muted)]">
        This guide describes what each number and chart means and roughly how it&apos;s calculated — it deliberately leaves out formulas and technical detail.
      </p>
    </div>
  );
}
