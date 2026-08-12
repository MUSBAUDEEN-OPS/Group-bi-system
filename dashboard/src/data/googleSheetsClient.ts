import { JWT } from "google-auth-library";

// Read-only scope only — this source is never allowed to write back to the
// user's spreadsheets, by design (see docs/schema.md / README).
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

let jwtClient: JWT | null = null;

function getClient(): JWT {
  if (jwtClient) return jwtClient;
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY are not set.");
  }
  // Env vars typically store the PEM key with literal "\n" escapes.
  jwtClient = new JWT({ email, key: key.replace(/\\n/g, "\n"), scopes: SCOPES });
  return jwtClient;
}

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
      process.env.GOOGLE_SHEETS_PRIVATE_KEY &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID_HAJJ_UMRAH &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID_HOTEL &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID_BAKERY &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID_GROUP,
  );
}

function rowsToRecords(values: string[][]): Record<string, string>[] {
  if (values.length === 0) return [];
  const [headers, ...rows] = values;
  return rows
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = row[i] ?? ""));
      return obj;
    });
}

export class SheetsFetchError extends Error {}

// Fetches one tab's values via the plain Sheets REST API (rather than the
// full googleapis SDK) so Next's fetch(..., { next: { revalidate } })
// caching applies for free — same pattern as data/exchangeRate.ts.
export async function fetchTab(spreadsheetId: string, tabName: string): Promise<Record<string, string>[]> {
  const client = getClient();
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new SheetsFetchError(`Could not obtain a Google Sheets access token for tab "${tabName}".`);
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 600 }, // 10 min — balances freshness against Sheets API quota
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new SheetsFetchError(
      `Failed to read Google Sheets tab "${tabName}" (spreadsheet ${spreadsheetId}): ${res.status} ${res.statusText}. ${body}`.trim(),
    );
  }

  const data = (await res.json()) as { values?: string[][] };
  return rowsToRecords(data.values ?? []);
}
