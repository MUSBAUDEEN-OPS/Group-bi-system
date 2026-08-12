// Row types for every table in the Group BI schema (brief §4).
// These mirror the eventual Google Sheets tab structure 1:1 — field names and
// enums here should match column headers exactly when a GoogleSheetsSource
// implementation lands, so this file doubles as the schema contract.

export type BusinessUnit = "HajjUmrah" | "Hotel" | "Bakery";
export type ExpenseBusinessUnit = BusinessUnit | "Group";

// ---------------------------------------------------------------------------
// 4.1 Hajj & Umrah Tourism
// ---------------------------------------------------------------------------

export type PackageTier = "Economy" | "Standard" | "VIP";
export type Season = "Hajj" | "Umrah";
export type BookingStatus = "confirmed" | "cancelled" | "refunded";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface RawBooking {
  booking_id: string;
  date_booked: string; // ISO date
  pilgrim_name: string;
  customer_id: string; // synthetic stable id, used for repeat-customer rate
  package_tier: PackageTier;
  package_price: number;
  num_pax: number;
  agent_id: string | null;
  status: BookingStatus;
  departure_group_id: string;
  payment_status: PaymentStatus;
  amount_paid: number;
  season: Season;
  inquiry_source: string;
}

export interface RawInquiry {
  inquiry_id: string;
  date: string;
  source: string;
  package_tier_interest: PackageTier;
  season: Season;
  converted_booking_id: string | null;
}

export interface RawDeparture {
  departure_group_id: string;
  departure_date: string;
  season: Season;
  capacity: number;
  destination: string;
}

export interface RawVisaPermit {
  booking_id: string;
  visa_cost: number;
  permit_cost: number;
  processed_date: string;
}

export interface RawCustomerFeedback {
  booking_id: string;
  nps_score: number; // 0-10
  survey_date: string;
  comments: string;
}

export interface ReferenceAgent {
  agent_id: string;
  agent_name: string;
  commission_rate: number;
}

export interface ReferencePackagePriceListEntry {
  package_tier: PackageTier;
  season: Season;
  base_price: number;
  inclusions: string;
}

// ---------------------------------------------------------------------------
// 4.2 Hotel
// ---------------------------------------------------------------------------

export type BookingChannel = "direct" | "agent" | "OTA";
export type ReservationStatus = "confirmed" | "cancelled" | "no_show";

export interface RawReservation {
  reservation_id: string;
  checkin_date: string;
  checkout_date: string;
  room_type: string;
  rate_per_night: number;
  num_nights: number;
  booking_channel: BookingChannel;
  guest_id: string;
  status: ReservationStatus;
}

export interface RawFnBSale {
  date: string;
  reservation_id: string | null; // null = walk-in
  amount: number;
}

export interface RawGuestFeedback {
  reservation_id: string;
  rating: number; // 1-5
  date: string;
}

export interface ReferenceRoomType {
  room_type: string;
  total_rooms: number;
  standard_rate: number;
}

// ---------------------------------------------------------------------------
// 4.3 Bakery
// ---------------------------------------------------------------------------

export interface RawProduction {
  date: string;
  outlet_id: string;
  product_id: string;
  units_produced: number;
  ingredient_cost: number;
}

export interface RawSale {
  date: string;
  outlet_id: string;
  product_id: string;
  units_sold: number;
  unit_price: number;
  transaction_id: string;
}

export interface RawWaste {
  date: string;
  outlet_id: string;
  product_id: string;
  units_wasted: number;
  reason: string;
}

export interface ReferenceOutlet {
  outlet_id: string;
  outlet_name: string;
  location: string;
}

export interface ReferenceProduct {
  product_id: string;
  product_name: string;
  category: string;
  standard_recipe_cost: number;
}

// ---------------------------------------------------------------------------
// 4.4 Cross-unit (Finance & HR)
// ---------------------------------------------------------------------------

export interface RawExpense {
  date: string;
  business_unit: ExpenseBusinessUnit;
  category: string;
  amount: number;
  description: string;
}

export interface RawPayroll {
  month: string; // YYYY-MM
  employee_id: string;
  business_unit: BusinessUnit;
  department: string;
  base_salary: number;
  overtime_hours: number;
  overtime_pay: number;
  bonus: number;
}

export interface ReferenceEmployee {
  employee_id: string;
  name: string;
  business_unit: BusinessUnit;
  department: string;
  role: string;
  hire_date: string;
  termination_date: string | null;
}

export type AccountCategory = "Revenue" | "COGS" | "OpEx" | "Other";

export interface ReferenceChartOfAccount {
  account_code: string;
  account_name: string;
  category: AccountCategory;
}

// ---------------------------------------------------------------------------
// 4.5 Summary tables (computed)
// ---------------------------------------------------------------------------

export interface SummaryMonthly {
  month: string; // YYYY-MM
  business_unit: BusinessUnit;
  revenue: number;
  cogs: number;
  opex: number;
  gross_profit: number;
  net_profit: number;
  headcount: number;
  payroll_cost: number;
}

export type KpiScope = BusinessUnit | "Group" | "Workforce";

export interface SummaryKpiSnapshot {
  month: string;
  business_unit: KpiScope;
  kpi_name: string;
  kpi_value: number;
}

// Small dedicated ranked/tabular summaries (see kpi-lib assumptions) — a
// single tidy (month, kpi_name, kpi_value) row doesn't fit ranked lists or
// categorical breakdowns cleanly, so these get their own precomputed tables.

export interface SummaryTopProduct {
  month: string;
  rank_by: "revenue" | "volume";
  rank: number;
  product_id: string;
  product_name: string;
  value: number;
}

export interface SummaryBookingChannelMix {
  month: string;
  booking_channel: BookingChannel;
  count: number;
  pct: number;
}

export interface SummaryRevenueMix {
  month: string;
  business_unit: BusinessUnit;
  revenue: number;
  pct_of_group: number;
}

// ---------------------------------------------------------------------------
// Full dataset bundle — what a DataSource implementation hands to kpi-lib /
// the dashboard.
// ---------------------------------------------------------------------------

export interface GroupBiDataset {
  raw: {
    bookings: RawBooking[];
    inquiries: RawInquiry[];
    departures: RawDeparture[];
    visaPermits: RawVisaPermit[];
    customerFeedback: RawCustomerFeedback[];
    reservations: RawReservation[];
    fnbSales: RawFnBSale[];
    guestFeedback: RawGuestFeedback[];
    production: RawProduction[];
    sales: RawSale[];
    waste: RawWaste[];
    expenses: RawExpense[];
    payroll: RawPayroll[];
  };
  reference: {
    agents: ReferenceAgent[];
    packagePriceList: ReferencePackagePriceListEntry[];
    roomTypes: ReferenceRoomType[];
    outlets: ReferenceOutlet[];
    products: ReferenceProduct[];
    employees: ReferenceEmployee[];
    chartOfAccounts: ReferenceChartOfAccount[];
  };
  summary: {
    monthly: SummaryMonthly[];
    kpiSnapshot: SummaryKpiSnapshot[];
    topProducts: SummaryTopProduct[];
    bookingChannelMix: SummaryBookingChannelMix[];
    revenueMix: SummaryRevenueMix[];
  };
}
