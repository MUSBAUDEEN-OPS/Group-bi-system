import type { DataSource } from "./DataSource";
import { LocalFileSource } from "./LocalFileSource";

let cached: DataSource | null = null;

// Single switch point for the whole app. Foundation phase always uses
// LocalFileSource; flipping to Google Sheets later is a one-line change
// here, not a UI rewrite.
export function getDataSource(): DataSource {
  if (!cached) cached = new LocalFileSource();
  return cached;
}
