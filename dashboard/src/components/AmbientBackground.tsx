// Purely decorative, whole-app backdrop — no data, so aria-hidden and
// excluded from print. Pure CSS (see globals.css): a slow midnight-to-amber
// gradient loop plus a faint drifting gold-dust layer, dark-mode only.
export function AmbientBackground() {
  return (
    <div className="ambient-bg-wrap no-print" aria-hidden="true">
      <div className="ambient-bg-gradient" />
      <div className="ambient-bg-dust" />
    </div>
  );
}
