import type { DataSource } from "./DataSource";
import { LocalFileSource } from "./LocalFileSource";
import { GoogleSheetsSource, isGoogleSheetsConfigured } from "./GoogleSheetsSource";

let cached: DataSource | null = null;

// Single switch point for the whole app. Picks GoogleSheetsSource
// automatically once its env vars are set (see .env.example) — local dev
// keeps using the synthetic LocalFileSource with zero config either way.
export function getDataSource(): DataSource {
  if (!cached) cached = isGoogleSheetsConfigured() ? new GoogleSheetsSource() : new LocalFileSource();
  return cached;
}
