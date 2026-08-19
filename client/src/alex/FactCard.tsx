import { COLORS, FONT_FAMILY } from "../theme";

// One card shape for the whole knowledge rail: green for what the country
// *is*, and a neutral grey for what it *isn't*, so the two read as positive
// and negative knowledge rather than as certain and provisional. Red is
// deliberately avoided here even though the guess tiles use it for a miss —
// an exclusion is something the player has established, not somewhere they
// went wrong.
export type FactTone = "correct" | "excluded";

const TONE_STYLE: Record<FactTone, { bg: string; border?: string; label: string; value: string }> = {
  correct: { bg: COLORS.correctBg, label: COLORS.correctLabel, value: COLORS.correctValue },
  excluded: { bg: COLORS.mutedBg, border: COLORS.mutedBorder, label: COLORS.mutedLabel, value: COLORS.mutedValue },
};

export function FactCard({
  header,
  label,
  layout,
  tone,
}: {
  header: string;
  label: string;
  layout: "column" | "row";
  tone: FactTone;
}) {
  const c = TONE_STYLE[tone];
  return (
    <div
      style={{
        background: c.bg,
        border: c.border ? `1px solid ${c.border}` : undefined,
        padding: layout === "row" ? "6px 9px" : "7px 10px",
        display: "flex",
        flexDirection: "column",
        gap: layout === "row" ? 1 : 2,
        flex: "none",
        minWidth: layout === "row" ? 96 : undefined,
        fontFamily: FONT_FAMILY,
      }}
    >
      <span
        style={{
          fontSize: layout === "row" ? 9 : 10,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: c.label,
        }}
      >
        {header}
      </span>
      <span
        style={{
          fontSize: layout === "row" ? 12 : 14,
          fontWeight: 800,
          color: c.value,
          whiteSpace: layout === "row" ? "nowrap" : undefined,
        }}
      >
        {label}
      </span>
    </div>
  );
}
