import type { DataSource } from "./DataSource";
import { LocalFileSource } from "./LocalFileSource";
import { GoogleSheetsSource, isGoogleSheetsConfigured } from "./GoogleSheetsSource";

let cached: DataSource | null = null;

// Single switch point for the whole app. Picks GoogleSheetsSource
// automatically once its env vars are set (see .env.example) — local dev
// keeps using the synthetic LocalFileSource with zero config either way.
//
// GROUP_BI_FORCE_DEMO=true overrides this back to the synthetic demo data
// even when the Sheets env vars are present — for pausing on real data
// (e.g. real entry isn't ready yet) without having to remove and later
// re-enter the Google Sheets credentials.
export function getDataSource(): DataSource {
  if (!cached) {
    const forceDemo = process.env.GROUP_BI_FORCE_DEMO === "true";
    cached = !forceDemo && isGoogleSheetsConfigured() ? new GoogleSheetsSource() : new LocalFileSource();
  }
  return cached;
}
