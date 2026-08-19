import { COLORS, FONT_FAMILY } from "../theme";

// Shared by ConfirmedFacts (locked-in attributes) and RemainingMysteries
// (bounds narrowed from "up"/"down" guesses) — same card shape, different
// tone so the two rails read as distinct at a glance.
export type FactTone = "correct" | "direction";

const TONE_STYLE: Record<FactTone, { bg: string; border?: string; label: string; value: string }> = {
  correct: { bg: COLORS.correctBg, label: COLORS.correctLabel, value: COLORS.correctValue },
  direction: { bg: COLORS.directionBg, border: COLORS.directionBorder, label: COLORS.directionLabel, value: COLORS.directionValue },
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
        padding: layout === "row" ? "8px 10px" : "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: layout === "row" ? 2 : 3,
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
