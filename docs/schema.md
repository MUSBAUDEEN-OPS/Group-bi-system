# Group BI schema

Human-readable copy of the data model. Field names and enums here match the
CSV column headers exactly (`kpi-lib/src/types.ts` is the source of truth —
this file is documentation, not a second source). Every `Raw_*` table is
append-only (one row per real-world event); `Reference_*` tables are
lookup/master data; `Summary_*` tables are precomputed monthly rollups the
dashboard reads from (it never recomputes from raw data at render time).

## Hajj & Umrah Tourism

| Table | Key fields |
|---|---|
| `Raw_Bookings` | `booking_id, date_booked, pilgrim_name, customer_id, package_tier (Economy\|Standard\|VIP), package_price, num_pax, agent_id?, status (confirmed\|cancelled\|refunded), departure_group_id, payment_status (paid\|partial\|unpaid), amount_paid, season (Hajj\|Umrah), inquiry_source` |
| `Raw_Inquiries` | `inquiry_id, date, source, package_tier_interest, season, converted_booking_id?` |
| `Raw_Departures` | `departure_group_id, departure_date, season, capacity, destination` |
| `Raw_VisaPermits` | `booking_id, visa_cost, permit_cost, processed_date` |
| `Raw_CustomerFeedback` | `booking_id, nps_score (0-10), survey_date, comments` |
| `Reference_Agents` | `agent_id, agent_name, commission_rate` |
| `Reference_PackagePriceList` | `package_tier, season, base_price, inclusions` |

`customer_id` is a generator-internal addition (not in the original brief
schema) needed to compute Repeat Customer Rate cleanly — `pilgrim_name`
alone isn't a reliable join key once two different customers can share a name.

## Hotel

| Table | Key fields |
|---|---|
| `Raw_Reservations` | `reservation_id, checkin_date, checkout_date, room_type, rate_per_night, num_nights, booking_channel (direct\|agent\|OTA), guest_id, status (confirmed\|cancelled\|no_show)` |
| `Raw_FnB_Sales` | `date, reservation_id? (null = walk-in), amount` |
| `Raw_GuestFeedback` | `reservation_id, rating (1-5), date` |
| `Reference_RoomTypes` | `room_type, total_rooms, standard_rate` |

## Bakery

| Table | Key fields |
|---|---|
| `Raw_Production` | `date, outlet_id, product_id, units_produced, ingredient_cost` |
| `Raw_Sales` | `date, outlet_id, product_id, units_sold, unit_price, transaction_id` |
| `Raw_Waste` | `date, outlet_id, product_id, units_wasted, reason` |
| `Reference_Outlets` | `outlet_id, outlet_name, location` |
| `Reference_Products` | `product_id, product_name, category, standard_recipe_cost` |

## Cross-unit (Finance & HR)

| Table | Key fields |
|---|---|
| `Raw_Expenses` | `date, business_unit (HajjUmrah\|Hotel\|Bakery\|Group), category, amount, description` |
| `Raw_Payroll` | `month, employee_id, business_unit, department, base_salary, overtime_hours, overtime_pay, bonus` |
| `Reference_Employees` | `employee_id, name, business_unit, department, role, hire_date, termination_date?` |
| `Reference_ChartOfAccounts` | `account_code, account_name, category (Revenue\|COGS\|OpEx\|Other)` |

`business_unit = "Group"` on `Raw_Expenses` is corporate overhead not
attributable to a single unit (e.g. Chairman's office, group marketing) — it
feeds the Cash Position KPI only, not any unit's `Summary_Monthly.opex`.

## Summary (computed)

| Table | Shape |
|---|---|
| `Summary_Monthly` | one row per `(month, business_unit)`: `revenue, cogs, opex, gross_profit, net_profit, headcount, payroll_cost` |
| `Summary_KPISnapshot` | long/tidy: `(month, business_unit, kpi_name, kpi_value)` — every KPI in the catalog, one row each |
| `Summary_TopProducts` | `(month, rank_by (revenue\|volume), rank, product_id, product_name, value)` — top 10 |
| `Summary_BookingChannelMix` | `(month, booking_channel, count, pct)` |
| `Summary_RevenueMix` | `(month, business_unit, revenue, pct_of_group)` |

The last three exist because a single tidy `(month, kpi_name, kpi_value)` row
doesn't cleanly fit ranked lists or categorical breakdowns — they're still
fully precomputed at generation time, just shaped for their specific chart.

## KPI aggregation across a date range

The dashboard's date-range filter (this month / last 3 months / YTD / custom)
combines `Summary_KPISnapshot` rows in one of three ways, chosen per KPI
(`dashboard/src/lib/kpiAggregate.ts`):

- **Sum** — flow metrics: revenue, pilgrim counts, production volume, overtime, budget variance.
- **Latest** — point-in-time metrics: headcount, cash position.
- **Average** — everything else (rates/ratios/margins). This is a documented
  simplification: the snapshot stores the ratio itself, not its numerator and
  denominator, so an exact multi-month recomposition isn't available without
  reading raw data — which the brief explicitly says not to do at render time.
