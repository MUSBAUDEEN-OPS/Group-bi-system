import { cache } from "react";
import {
  deriveMonthRange,
  revenueKpis,
  summarizeDataset,
  validateDataset,
  ReferentialIntegrityError,
  type AccountCategory,
  type BookingChannel,
  type BookingStatus,
  type BusinessUnit,
  type ExpenseBusinessUnit,
  type GroupBiDataset,
  type KpiConfig,
  type PackageTier,
  type PaymentStatus,
  type ReferenceEmployee,
  type ReferenceOutlet,
  type ReferenceProduct,
  type ReferenceRoomType,
  type ReservationStatus,
  type Season,
  type SummaryBookingChannelMix,
  type SummaryKpiSnapshot,
  type SummaryMonthly,
  type SummaryRevenueMix,
  type SummaryTopProduct,
} from "@group-bi/kpi-lib";
import type { DataSource } from "./DataSource";
import { fetchTab, isGoogleSheetsConfigured, SheetsFetchError } from "./googleSheetsClient";
import { num, strOrNull } from "./csv";

type RawDataset = Pick<GroupBiDataset, "raw" | "reference">;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new SheetsFetchError(`Missing required env var ${name}.`);
  return value;
}

function spreadsheetIds() {
  return {
    hajjUmrah: requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID_HAJJ_UMRAH"),
    hotel: requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID_HOTEL"),
    bakery: requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID_BAKERY"),
    group: requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID_GROUP"),
  };
}

// ---------------------------------------------------------------------------
// Row mapping — Sheets gives every cell back as a string; convert to the
// same typed shape kpi-lib's pipeline expects (mirrors LocalFileSource's
// CSV mapping in shape, since both ultimately feed the same table types).
// ---------------------------------------------------------------------------

async function loadDatasetUncached(): Promise<RawDataset> {
  const ids = spreadsheetIds();

  const [
    bookingsRows, inquiriesRows, departuresRows, visaPermitsRows, customerFeedbackRows, agentsRows, priceListRows,
    reservationsRows, fnbSalesRows, guestFeedbackRows, roomTypesRows,
    productionRows, salesRows, wasteRows, outletsRows, productsRows,
    expensesRows, payrollRows, employeesRows, chartOfAccountsRows,
  ] = await Promise.all([
    fetchTab(ids.hajjUmrah, "Raw_Bookings"),
    fetchTab(ids.hajjUmrah, "Raw_Inquiries"),
    fetchTab(ids.hajjUmrah, "Raw_Departures"),
    fetchTab(ids.hajjUmrah, "Raw_VisaPermits"),
    fetchTab(ids.hajjUmrah, "Raw_CustomerFeedback"),
    fetchTab(ids.hajjUmrah, "Reference_Agents"),
    fetchTab(ids.hajjUmrah, "Reference_PackagePriceList"),
    fetchTab(ids.hotel, "Raw_Reservations"),
    fetchTab(ids.hotel, "Raw_FnB_Sales"),
    fetchTab(ids.hotel, "Raw_GuestFeedback"),
    fetchTab(ids.hotel, "Reference_RoomTypes"),
    fetchTab(ids.bakery, "Raw_Production"),
    fetchTab(ids.bakery, "Raw_Sales"),
    fetchTab(ids.bakery, "Raw_Waste"),
    fetchTab(ids.bakery, "Reference_Outlets"),
    fetchTab(ids.bakery, "Reference_Products"),
    fetchTab(ids.group, "Raw_Expenses"),
    fetchTab(ids.group, "Raw_Payroll"),
    fetchTab(ids.group, "Reference_Employees"),
    fetchTab(ids.group, "Reference_ChartOfAccounts"),
  ]);

  return {
    raw: {
      bookings: bookingsRows.map((r) => ({
        booking_id: r.booking_id,
        date_booked: r.date_booked,
        pilgrim_name: r.pilgrim_name,
        customer_id: r.customer_id,
        package_tier: r.package_tier as PackageTier,
        package_price: num(r.package_price),
        num_pax: num(r.num_pax),
        agent_id: strOrNull(r.agent_id),
        status: r.status as BookingStatus,
        departure_group_id: r.departure_group_id,
        payment_status: r.payment_status as PaymentStatus,
        amount_paid: num(r.amount_paid),
        season: r.season as Season,
        inquiry_source: r.inquiry_source,
      })),
      inquiries: inquiriesRows.map((r) => ({
        inquiry_id: r.inquiry_id,
        date: r.date,
        source: r.source,
        package_tier_interest: r.package_tier_interest as PackageTier,
        season: r.season as Season,
        converted_booking_id: strOrNull(r.converted_booking_id),
      })),
      departures: departuresRows.map((r) => ({
        departure_group_id: r.departure_group_id,
        departure_date: r.departure_date,
        season: r.season as Season,
        capacity: num(r.capacity),
        destination: r.destination,
      })),
      visaPermits: visaPermitsRows.map((r) => ({
        booking_id: r.booking_id,
        visa_cost: num(r.visa_cost),
        permit_cost: num(r.permit_cost),
        processed_date: r.processed_date,
      })),
      customerFeedback: customerFeedbackRows.map((r) => ({
        booking_id: r.booking_id,
        nps_score: num(r.nps_score),
        survey_date: r.survey_date,
        comments: r.comments,
      })),
      reservations: reservationsRows.map((r) => ({
        reservation_id: r.reservation_id,
        checkin_date: r.checkin_date,
        checkout_date: r.checkout_date,
        room_type: r.room_type,
        rate_per_night: num(r.rate_per_night),
        num_nights: num(r.num_nights),
        booking_channel: r.booking_channel as BookingChannel,
        guest_id: r.guest_id,
        status: r.status as ReservationStatus,
      })),
      fnbSales: fnbSalesRows.map((r) => ({
        date: r.date,
        reservation_id: strOrNull(r.reservation_id),
        amount: num(r.amount),
      })),
      guestFeedback: guestFeedbackRows.map((r) => ({
        reservation_id: r.reservation_id,
        rating: num(r.rating),
        date: r.date,
      })),
      production: productionRows.map((r) => ({
        date: r.date,
        outlet_id: r.outlet_id,
        product_id: r.product_id,
        units_produced: num(r.units_produced),
        ingredient_cost: num(r.ingredient_cost),
      })),
      sales: salesRows.map((r) => ({
        date: r.date,
        outlet_id: r.outlet_id,
        product_id: r.product_id,
        units_sold: num(r.units_sold),
        unit_price: num(r.unit_price),
        transaction_id: r.transaction_id,
      })),
      waste: wasteRows.map((r) => ({
        date: r.date,
        outlet_id: r.outlet_id,
        product_id: r.product_id,
        units_wasted: num(r.units_wasted),
        reason: r.reason,
      })),
      expenses: expensesRows.map((r) => ({
        date: r.date,
        business_unit: r.business_unit as ExpenseBusinessUnit,
        category: r.category,
        amount: num(r.amount),
        description: r.description,
      })),
      payroll: payrollRows.map((r) => ({
        month: r.month,
        employee_id: r.employee_id,
        business_unit: r.business_unit as BusinessUnit,
        department: r.department,
        base_salary: num(r.base_salary),
        overtime_hours: num(r.overtime_hours),
        overtime_pay: num(r.overtime_pay),
        bonus: num(r.bonus),
      })),
    },
    reference: {
      agents: agentsRows.map((r) => ({
        agent_id: r.agent_id,
        agent_name: r.agent_name,
        commission_rate: num(r.commission_rate),
      })),
      packagePriceList: priceListRows.map((r) => ({
        package_tier: r.package_tier as PackageTier,
        season: r.season as Season,
        base_price: num(r.base_price),
        inclusions: r.inclusions,
      })),
      roomTypes: roomTypesRows.map((r) => ({
        room_type: r.room_type,
        total_rooms: num(r.total_rooms),
        standard_rate: num(r.standard_rate),
      })) satisfies ReferenceRoomType[],
      outlets: outletsRows.map((r) => ({
        outlet_id: r.outlet_id,
        outlet_name: r.outlet_name,
        location: r.location,
      })) satisfies ReferenceOutlet[],
      products: productsRows.map((r) => ({
        product_id: r.product_id,
        product_name: r.product_name,
        category: r.category,
        standard_recipe_cost: num(r.standard_recipe_cost),
      })) satisfies ReferenceProduct[],
      employees: employeesRows.map((r) => ({
        employee_id: r.employee_id,
        name: r.name,
        business_unit: r.business_unit as BusinessUnit,
        department: r.department,
        role: r.role,
        hire_date: r.hire_date,
        termination_date: strOrNull(r.termination_date),
      })) satisfies ReferenceEmployee[],
      chartOfAccounts: chartOfAccountsRows.map((r) => ({
        account_code: r.account_code,
        account_name: r.account_name,
        category: r.category as AccountCategory,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Business config — the handful of figures the KPI layer needs but can't
// derive from raw entries (capital employed, opening cash, EBITDA add-back,
// attendance placeholder). Lives in a two-column "Reference_Config" tab in
// the Group workbook (key, value) so it's editable the same way as every
// other table — no code change or redeploy needed to adjust an assumption.
// Missing keys fall back to the same defaults the demo dataset uses.
// ---------------------------------------------------------------------------

const CONFIG_DEFAULTS = {
  ebitda_addback_pct: 0.08,
  opening_cash_balance: 0,
  capital_employed_hajj_umrah: 1,
  capital_employed_hotel: 1,
  capital_employed_bakery: 1,
  attendance_placeholder_hajj_umrah: 1,
  attendance_placeholder_hotel: 1,
  attendance_placeholder_bakery: 1,
};

async function loadKpiConfig(raw: RawDataset["raw"], months: string[]): Promise<KpiConfig> {
  const ids = spreadsheetIds();
  const configRows = await fetchTab(ids.group, "Reference_Config");
  const values = { ...CONFIG_DEFAULTS };
  for (const row of configRows) {
    const key = row.key as keyof typeof CONFIG_DEFAULTS;
    if (key in values && row.value !== "") values[key] = num(row.value);
  }

  // Budget target: flat monthly figure per unit, defaulted to this year's
  // own average monthly revenue x a modest stretch factor — the same
  // placeholder approach the brief specifies for when no prior year exists
  // to base a target on (see data-generator/src/config.ts for the twin
  // logic used on the synthetic dataset).
  const revenueByUnitMonth: Record<BusinessUnit, Record<string, number>> = {
    HajjUmrah: revenueKpis.monthlyHajjUmrahRevenue(raw.bookings, raw.departures),
    Hotel: (() => {
      const room = revenueKpis.monthlyHotelRoomRevenue(raw.reservations);
      const fnb = revenueKpis.monthlyHotelFnbRevenue(raw.fnbSales);
      const combined: Record<string, number> = {};
      for (const m of months) combined[m] = (room[m] ?? 0) + (fnb[m] ?? 0);
      return combined;
    })(),
    Bakery: revenueKpis.monthlyBakeryRevenue(raw.sales),
  };
  const budgetTargetsByUnit: KpiConfig["budgetTargetsByUnit"] = { HajjUmrah: {}, Hotel: {}, Bakery: {} };
  for (const unit of ["HajjUmrah", "Hotel", "Bakery"] as BusinessUnit[]) {
    const revenues = Object.values(revenueByUnitMonth[unit]);
    const avg = revenues.reduce((sum, v) => sum + v, 0) / (revenues.length || 1);
    for (const month of months) budgetTargetsByUnit[unit][month] = Math.round(avg * 1.03);
  }

  return {
    ebitdaAddBackPct: values.ebitda_addback_pct,
    openingCashBalance: values.opening_cash_balance,
    capitalEmployedByUnit: {
      HajjUmrah: values.capital_employed_hajj_umrah,
      Hotel: values.capital_employed_hotel,
      Bakery: values.capital_employed_bakery,
    },
    attendancePlaceholderByUnit: {
      HajjUmrah: values.attendance_placeholder_hajj_umrah,
      Hotel: values.attendance_placeholder_hotel,
      Bakery: values.attendance_placeholder_bakery,
    },
    budgetTargetsByUnit,
  };
}

// React's request-scoped cache dedupes this across every DataSource method
// called within the same page render (each page currently calls 2-5 of
// them) — without it, a single page load would re-fetch and re-map from
// scratch per method. The underlying fetchTab() calls also carry Next's own
// cross-request fetch cache (10 min), so this isn't the only layer, just
// the one that keeps a single request from doing the work several times over.
const loadDataset = cache(loadDatasetUncached);

const getComputedDataset = cache(async () => {
  const dataset = await loadDataset();
  try {
    validateDataset(dataset);
  } catch (err) {
    if (err instanceof ReferentialIntegrityError) {
      throw new SheetsFetchError(
        `Your Google Sheets data has ${err.message.match(/(\d+) violation/)?.[1] ?? "some"} row(s) referencing IDs that don't exist elsewhere ` +
          `(e.g. a booking's agent_id that isn't in Reference_Agents). Fix the listed rows and reload.\n\n${err.message}`,
      );
    }
    throw err;
  }
  const months = deriveMonthRange(dataset.raw);
  const config = await loadKpiConfig(dataset.raw, months);
  return summarizeDataset(dataset, config);
});

export class GoogleSheetsSource implements DataSource {
  async getSummaryMonthly(): Promise<SummaryMonthly[]> {
    return (await getComputedDataset()).monthly;
  }
  async getKpiSnapshot(): Promise<SummaryKpiSnapshot[]> {
    return (await getComputedDataset()).kpiSnapshot;
  }
  async getTopProducts(): Promise<SummaryTopProduct[]> {
    return (await getComputedDataset()).topProducts;
  }
  async getBookingChannelMix(): Promise<SummaryBookingChannelMix[]> {
    return (await getComputedDataset()).bookingChannelMix;
  }
  async getRevenueMix(): Promise<SummaryRevenueMix[]> {
    return (await getComputedDataset()).revenueMix;
  }
  async getReferenceOutlets(): Promise<ReferenceOutlet[]> {
    return (await loadDataset()).reference.outlets;
  }
  async getReferenceProducts(): Promise<ReferenceProduct[]> {
    return (await loadDataset()).reference.products;
  }
  async getReferenceRoomTypes(): Promise<ReferenceRoomType[]> {
    return (await loadDataset()).reference.roomTypes;
  }
  async getReferenceEmployees(): Promise<ReferenceEmployee[]> {
    return (await loadDataset()).reference.employees;
  }
}

export { isGoogleSheetsConfigured };
