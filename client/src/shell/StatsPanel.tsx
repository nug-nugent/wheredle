import type { Stats } from "../stats";
import { statFigures } from "./statsLayout";
import { COLORS, FONT_FAMILY } from "../theme";

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ minWidth: 72 }}>
      <div style={{ fontSize: 24, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: COLORS.textDimmed }}>
        {label}
      </div>
    </div>
  );
}

// The numbers a daily player actually tracks, above the chart that shows the
// same games spread out. The average is here rather than under the bars
// because it's the one figure that stays meaningful at three games, where the
// bars are still mostly a shape — an em dash until there's a solved game to
// average.
export function StatsPanel({ stats }: { stats: Stats }) {
  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 16, fontFamily: FONT_FAMILY }}>
      {statFigures(stats).map((figure) => (
        <Figure key={figure.label} value={figure.value} label={figure.label} />
      ))}
    </div>
  );
}
