# Group BI & Automation System — Foundation Phase

A synthetic dataset plus an interactive, mobile-first, installable (PWA)
dashboard prototype for a group with three business lines under one
ownership — **Hajj & Umrah Tourism**, **Hotel**, and **Bakery** — plus a
consolidated **Group** view for the Chairman and stakeholders.

This started as the **foundation phase**, running entirely on generated
synthetic data with no real company data or external services touched. The
dashboard now also supports a real, live data source — Google Sheets — via
a swappable data-adapter interface, so pointing it at real data is a
config change, not a rebuild (see
[Pointing this at real Google Sheets](#pointing-this-at-real-google-sheets)).
Real data entry hasn't started yet; the demo data still runs by default
until the env vars below are set.

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

## Pointing this at real Google Sheets

The dashboard never talks to the filesystem directly — every page calls
`getDataSource()` (`dashboard/src/data/getDataSource.ts`), which picks
between two implementations of the `DataSource` interface
(`dashboard/src/data/DataSource.ts`): `LocalFileSource` (the synthetic demo
data) or `GoogleSheetsSource` (real data), automatically, based on whether
the `GOOGLE_SHEETS_*` env vars are set. No page, component, or KPI
calculation changes either way — both implementations feed the exact same
interface.

`GoogleSheetsSource` is **read-only** — it only ever needs Viewer access on
your workbooks and never writes anything back. It reads the raw entries,
validates them, and computes every KPI on-demand each time the dashboard
loads (cached briefly — see `docs/schema.md`), rather than a scheduled job
that writes precomputed numbers back into Sheets.

### Setup checklist

1. **Google Cloud**: create/select a project → enable the **Google Sheets
   API** → create a service account → generate a JSON key. Note the
   service account's email and private key.
2. **Workbooks**: create 4 Google Sheets workbooks — Hajj & Umrah, Hotel,
   Bakery, Group — with tabs and columns matching `docs/schema.md` exactly
   (tab names are case-sensitive). Share each workbook with the service
   account's email as **Viewer**.
3. **Business assumptions**: add a `Reference_Config` tab to the Group
   workbook (see `docs/schema.md` for the key/value list — capital
   employed per unit, opening cash balance, etc). Any key you skip falls
   back to a neutral default.
4. **Env vars** — locally in `dashboard/.env.local`, and in production via
   `vercel env add` (see `dashboard/.env.example` for the full list):
   `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, and the 4
   `GOOGLE_SHEETS_SPREADSHEET_ID_*` vars (the ID in a sheet's URL between
   `/d/` and `/edit`).
5. Reload the dashboard — once every var above is set, `getDataSource()`
   switches to `GoogleSheetsSource` with no further changes.

A bad reference (e.g. a booking's `agent_id` that isn't in
`Reference_Agents`) surfaces as a clear, specific error naming the tab and
the bad value, rather than a silent wrong number or a crash — see
`validateDataset` in `kpi-lib/src/pipeline/validate.ts`.
