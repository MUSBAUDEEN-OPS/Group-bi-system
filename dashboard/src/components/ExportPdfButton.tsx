"use client";

export function ExportPdfButton({ label = "Export PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex min-h-11 shrink-0 items-center rounded-full border border-white/20 px-4 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
    >
      {label}
    </button>
  );
}
