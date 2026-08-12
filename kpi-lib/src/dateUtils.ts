// Small date helpers shared across KPI modules. All "month" values in this
// codebase are "YYYY-MM" strings so they sort lexicographically and are
// trivial to use as CSV/table keys.

export function monthOf(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthsBetween(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  let cur = startMonth;
  while (cur <= endMonth) {
    months.push(cur);
    cur = addMonths(cur, 1);
  }
  return months;
}

export function priorYearMonth(month: string): string {
  return addMonths(month, -12);
}
