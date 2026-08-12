const UP_PATH = "M7 2 L12 9 L8.5 9 L8.5 12 L5.5 12 L5.5 9 L2 9 Z";
const DOWN_PATH = "M7 12 L2 5 L5.5 5 L5.5 2 L8.5 2 L8.5 5 L12 5 Z";

export function TrendArrowIcon({ direction, color }: { direction: "up" | "down"; color: string }) {
  const motionClass = direction === "up" ? "motion-icon-trend-up" : "motion-icon-trend-down";
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className={motionClass}>
      <path d={direction === "up" ? UP_PATH : DOWN_PATH} fill={color} />
    </svg>
  );
}
