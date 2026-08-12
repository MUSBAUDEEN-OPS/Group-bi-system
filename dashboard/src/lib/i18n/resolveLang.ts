import type { Lang } from "./translations";

export function resolveLangFromSearchParams(searchParams: Record<string, string | string[] | undefined>): Lang {
  const raw = searchParams.lang;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "ar" ? "ar" : "en";
}
