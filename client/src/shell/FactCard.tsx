import { COLORS, FONT_FAMILY } from "../theme";

// One card shape for both rails: green for something established as true,
// red for a guess that missed, and a neutral grey for something ruled out.
//
// The grey is the point of the third tone. Alex mode's rail is mostly
// exclusions — things the player has established, not places they went
// wrong — and dressing those in red would say the opposite. Red stays for
// an actual miss, which is what classic mode's rail of past guesses is
// full of.
export type FactTone = "correct" | "wrong" | "excluded";

const TONE_STYLE: Record<FactTone, { bg: string; border?: string; label: string; value: string }> = {
  correct: { bg: COLORS.correctBg, label: COLORS.correctLabel, value: COLORS.correctValue },
  wrong: { bg: COLORS.wrongBg, label: COLORS.wrongLabel, value: COLORS.wrongValue },
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
        // Never wider than one screenful of the rail it sits in. The strip
        // is a horizontal scroller, so without this a card simply grows to
        // its content and a long label makes a card you scroll *through* —
        // and its header leaves the screen while you're still reading its
        // value. 100% resolves against the flex container's visible width,
        // not the scrolled width, which is what makes it the right bound
        // and why there's no magic number here. Alex's language exclusions
        // are what reach it: "not Chibarwe, not English, not Kalanga, …"
        // runs to three times a phone's width after a Zimbabwe guess.
        maxWidth: layout === "row" ? "100%" : undefined,
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
        }}
      >
        {label}
      </span>
    </div>
  );
}
