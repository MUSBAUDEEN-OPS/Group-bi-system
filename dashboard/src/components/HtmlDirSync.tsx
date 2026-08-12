"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Next.js layouts can't read searchParams server-side, so `dir`/`lang` on
// <html> are synced client-side instead — this means a direct link to
// ?lang=ar renders LTR for one frame before flipping RTL. Documented
// trade-off (see plan): avoids introducing a second (cookie-based) source
// of truth for language when every other filter already lives in the URL.
export function HtmlDirSync() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "ar" ? "ar" : "en";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return null;
}
