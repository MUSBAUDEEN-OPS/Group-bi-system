import type {
  ReferenceEmployee,
  ReferenceOutlet,
  ReferenceProduct,
  ReferenceRoomType,
  SummaryBookingChannelMix,
  SummaryKpiSnapshot,
  SummaryMonthly,
  SummaryRevenueMix,
  SummaryTopProduct,
} from "@group-bi/kpi-lib";

// Everything the dashboard reads is precomputed (Summary_* tables) plus a
// handful of small reference/lookup tables for display labels — never raw
// event tables, per the brief: precompute summaries once, don't recompute
// from raw data at render time.
//
// Swapping the production data source to Google Sheets means implementing
// this interface against the Sheets API — no UI code should need to change.
export interface DataSource {
  getSummaryMonthly(): Promise<SummaryMonthly[]>;
  getKpiSnapshot(): Promise<SummaryKpiSnapshot[]>;
  getTopProducts(): Promise<SummaryTopProduct[]>;
  getBookingChannelMix(): Promise<SummaryBookingChannelMix[]>;
  getRevenueMix(): Promise<SummaryRevenueMix[]>;
  getReferenceOutlets(): Promise<ReferenceOutlet[]>;
  getReferenceProducts(): Promise<ReferenceProduct[]>;
  getReferenceRoomTypes(): Promise<ReferenceRoomType[]>;
  getReferenceEmployees(): Promise<ReferenceEmployee[]>;
}
