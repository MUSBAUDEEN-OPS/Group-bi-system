# Group BI & Automation System — Foundation Phase

A synthetic dataset plus an interactive, mobile-first, installable (PWA)
dashboard prototype for a group with three business lines under one
ownership — **Hajj & Umrah Tourism**, **Hotel**, and **Bakery** — plus a
consolidated **Group** view for the Chairman and stakeholders.

This is the **foundation phase**: everything here runs on generated
synthetic data. No real company data or external services are touched. The
long-term production data source will be Google Sheets — the dashboard is
already built against a swappable data-adapter interface so that swap won't
require any UI changes (see [Pointing this at real Google Sheets](#pointing-this-at-real-google-sheets-later)).

## Project structure

```
Group-bi-system/
├── kpi-lib/          shared KPI calculation layer (used by both the generator and the dashboard)
├── data-generator/   synthetic data generator → CSVs in data-generator/output/ (gitignored)
├── dashboard/         Next.js + TypeScript + Tailwind + Recharts PWA
└── docs/schema.md     human-readable schema reference
```

npm workspaces tie the three packages together. `kpi-lib` is consumed as
compiled JS (`kpi-lib/dist`), not raw TypeScript — Turbopack (used by
`next dev`) doesn't resolve the TS `NodeNext`-style `./foo.js` import
convention `tsx`/`vitest` are fine with, so it needs a real build step. This
is handled automatically: `npm run generate` and `npm run dev` at the root
both rebuild `kpi-lib` first via npm's `pre<script>` hooks.

## Running it locally

Requires Node.js 20+.

```bash
npm install          # once, from the repo root
npm run generate      # generates a fresh synthetic dataset into data-generator/output/
npm run dev           # starts the dashboard at http://localhost:3000
```

Other useful scripts (run from the repo root):

```bash
npm test                          # kpi-lib's Vitest suite (the ★ KPIs, hand-checked)
npm run build                     # production build of the dashboard
npm run generate -- --seed 7      # regenerate with a different seed (see below)
```

## How the synthetic data was generated

`data-generator/src/generate.ts` builds one fiscal year (2025) of
internally-consistent data:

1. **Reference/lookup data** — agents, package price list, room types,
   bakery outlets & products, chart of accounts, employees.
2. **Hajj & Umrah** — departure groups (Hajj-season + a Umrah departure
   roughly every 8–10 days, denser during Ramadan/school-holiday/winter
   windows) drive booking generation bottom-up per departure, with realistic
   fill rates, cancellations, payment status, visa/permit costs, inquiries
   (for conversion rate), and NPS survey responses.
3. **Hotel** — daily new-reservation volume derived from a
   weekday/weekend occupancy target (with a seasonal peak-month multiplier),
   room-type mix weighted by room count, booking-channel mix, F&B sales
   (both tied to a stay and walk-in).
4. **Bakery** — daily transactions per outlet (spiking during Ramadan/Eid
   windows) drive sales; production and waste are derived *from* sales
   (`units_produced = units_sold / (1 - waste_ratio)`), which guarantees
   production always covers what was sold.
5. **Finance** — OpEx is generated as a percentage of that unit's own
   revenue (not a flat amount) so it scales sensibly regardless of a unit's
   absolute price level; COGS is unit-specific (visa/permit + agent
   commission + package delivery cost for Hajj/Umrah, F&B cost of goods +
   OTA/agent booking commission for Hotel, ingredient cost for Bakery).
6. **HR/Payroll** — employees distributed across units/departments with a
   small monthly termination probability; payroll computed per employee per
   month with occasional overtime and a December bonus.
7. **Validation** — every foreign key (`agent_id`, `outlet_id`,
   `employee_id`, `departure_group_id`, etc.) is checked against its
   reference table; the generator throws and refuses to write output if any
   are unresolved.
8. **Summarization** — `data-generator/src/summarize.ts` calls into
   `kpi-lib` to precompute `Summary_Monthly`, `Summary_KPISnapshot`,
   `Summary_TopProducts`, `Summary_BookingChannelMix`, and
   `Summary_RevenueMix` — the dashboard reads only these, never the raw
   event tables.
9. A **data-quality report** (row counts, date range, sanity checks) is
   printed and saved to `data-generator/output/data-quality-report.txt`.

**Regenerating with a different seed:**

```bash
npm run generate -- --seed 123
```

The generator seeds both its own PRNG (`data-generator/src/rng.ts`) and
`@faker-js/faker` from the same value, so a given seed always reproduces the
identical dataset. Seasonality curves, volume knobs, growth rate, and the
one deliberately-anomalous month per business unit are all tunable in
`data-generator/src/config.ts`.

**Known scope limitation:** the dataset covers exactly one fiscal year, so
the YoY Growth KPI correctly reports "insufficient history" everywhere
rather than being fabricated — the brief explicitly allows this instead of
inventing a second year of history.

**Known modeling limitation:** no depreciation, interest, or tax is
modeled as a raw expense line, so `net_profit` in `Summary_Monthly` is
closer to an EBITDA-like operating profit than a true bottom line — this is
also why the brief's EBITDA KPI uses a flat 8%-of-revenue add-back rather
than a real D&A schedule.

## Dashboard

- **Group Overview** (`/`) — the ★ KPIs only: consolidated revenue, net
  profit & margin, cash position, group headcount & payroll %, budget vs.
  actual — plus a one-line up/down trend per business unit that drill-downs
  into that unit's page with the same date range.
- **Hajj & Umrah** / **Hotel** / **Bakery** (`/hajj-umrah`, `/hotel`,
  `/bakery`) — full KPI set, charts (a trend chart with a Value/MoM%/YoY%
  toggle, plus category breakdowns), and the underlying monthly summary table.
- **Workforce** (`/workforce`) — group and per-unit HR metrics, including
  the Attendance/Punctuality KPI, which is a labeled **placeholder** constant
  (per config) pending a real `Raw_Attendance` table — the brief explicitly
  allows stubbing this in the foundation phase.
- **Global date-range filter** (this month / last 3 months / YTD / custom)
  lives in the URL query string, so it's shareable and scopes every page
  consistently — see `dashboard/src/lib/dateRange.ts` and `kpiAggregate.ts`
  for how a multi-month range combines KPI values (sum / latest / average,
  chosen per KPI).
- **Export PDF** uses the browser's native print (`window.print()`) with a
  `@media print` stylesheet that hides nav/filters — no extra libraries.
- **PWA**: `dashboard/public/manifest.json` + a hand-written
  `dashboard/public/sw.js` that caches an offline fallback page
  (`public/offline.html`) so a lost connection shows a branded message
  instead of a blank screen. It does not precache dashboard data — that
  always needs a live connection. Icons are placeholder SVGs
  (`public/icons/icon.svg`, navy/gold "GBI" monogram) — swap for real
  branding before a real deployment; some installability checkers still
  prefer fixed-size PNGs (192×192/512×512) over a single scalable SVG.
- **Colors**: chart series/status colors come from a validated (CVD-safe,
  contrast-checked) palette; brand chrome (header, nav, accents) uses a
  separate navy/gold placeholder theme, swappable in one place
  (`dashboard/src/app/globals.css` custom properties).

## Pointing this at real Google Sheets, later

The dashboard never talks to the filesystem directly — every page calls
`getDataSource()` (`dashboard/src/data/getDataSource.ts`), which returns a
`DataSource` (`dashboard/src/data/DataSource.ts`). Today that's
`LocalFileSource`, which reads the generator's CSVs off disk. To go live:

1. Implement the same `DataSource` interface in `GoogleSheetsSource.ts` (a
   stub with the required env vars and setup steps already documented
   inline) — one workbook per business unit plus a Group consolidation
   workbook, read via `spreadsheets.values.get` on tabs named exactly like
   the CSVs (`Summary_Monthly`, `Summary_KPISnapshot`, etc.).
2. Flip the one line in `getDataSource.ts` from `new LocalFileSource()` to
   `new GoogleSheetsSource()`.
3. No page, component, or KPI calculation changes — they all go through the
   `DataSource` interface already.

See `dashboard/.env.example` for the environment variables
`GoogleSheetsSource` will need.
