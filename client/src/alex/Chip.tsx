import type { CSSProperties } from "react";
import { COLORS, FONT_FAMILY, partialTint } from "../theme";

export type ChipTone = "correct" | "partial" | "wrong";

// The two flat tones. "partial" isn't here — it's a ramp rather than a
// single colour, mixed by partialTint from how deep the match runs.
const CHIP_STYLE: Record<Exclude<ChipTone, "partial">, { bg: string; color: string; sub: string }> = {
  correct: { bg: COLORS.correctBg, color: COLORS.correctValue, sub: COLORS.correctLabel },
  wrong: { bg: COLORS.wrongBg, color: COLORS.wrongValue, sub: COLORS.wrongLabel },
};

// One language of a guessed country. `ancestor` is the narrowest family it
// shares with the target, shown as a second line ("via Germanic") so the
// near-miss is readable without opening anything; `strength` is how deep
// that sharing runs, 0–1, which deepens a partial chip's tint. `onClick`
// turns the chip into the control for its own lineage ladder — without it
// the chip is inert text, as it is for a language outside the taxonomy.
export function Chip({
  name,
  tone,
  ancestor,
  strength = 0,
  expanded = false,
  onClick,
}: {
  name: string;
  tone: ChipTone;
  ancestor?: string;
  strength?: number;
  expanded?: boolean;
  onClick?: () => void;
}) {
  const c = tone === "partial" ? partialTint(strength) : CHIP_STYLE[tone];
  const style: CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 1,
    padding: "3px 9px",
    border: "none",
    background: c.bg,
    color: c.color,
    fontFamily: FONT_FAMILY,
    textAlign: "left",
  };

  const body = (
    <>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
      {ancestor && (
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: c.sub }}>
          via {ancestor}
        </span>
      )}
    </>
  );

  if (!onClick) return <span style={style}>{body}</span>;

  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} style={{ ...style, cursor: "pointer" }}>
      {body}
    </button>
  );
}
