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
import type { DataSource } from "./DataSource";

// Stub for the production data source. When this is implemented:
//
// 1. Create a Google Cloud service account with the Sheets API enabled and
//    "Viewer" access shared on every workbook (one per business unit, plus
//    the Group consolidation workbook).
// 2. Required env vars (see .env.example):
//      GOOGLE_SHEETS_CLIENT_EMAIL   — service account email
//      GOOGLE_SHEETS_PRIVATE_KEY    — service account private key (PEM)
//      GOOGLE_SHEETS_SPREADSHEET_ID_HAJJ_UMRAH
//      GOOGLE_SHEETS_SPREADSHEET_ID_HOTEL
//      GOOGLE_SHEETS_SPREADSHEET_ID_BAKERY
//      GOOGLE_SHEETS_SPREADSHEET_ID_GROUP
// 3. Each method below should read the matching tab (named exactly like the
//    CSVs LocalFileSource reads, e.g. "Summary_Monthly") via the Sheets API
//    (`spreadsheets.values.get`) and map rows using the same field names as
//    kpi-lib's types — no UI code should need to change.
export class GoogleSheetsSource implements DataSource {
  async getSummaryMonthly(): Promise<SummaryMonthly[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getKpiSnapshot(): Promise<SummaryKpiSnapshot[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getTopProducts(): Promise<SummaryTopProduct[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getBookingChannelMix(): Promise<SummaryBookingChannelMix[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getRevenueMix(): Promise<SummaryRevenueMix[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getReferenceOutlets(): Promise<ReferenceOutlet[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getReferenceProducts(): Promise<ReferenceProduct[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getReferenceRoomTypes(): Promise<ReferenceRoomType[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
  async getReferenceEmployees(): Promise<ReferenceEmployee[]> {
    throw new Error("GoogleSheetsSource not implemented — see comments in this file for required setup.");
  }
}
