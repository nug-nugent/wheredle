import { COLORS, FONT_FAMILY } from "../theme";

export type ChipTone = "correct" | "partial" | "wrong";

const CHIP_STYLE: Record<ChipTone, { bg: string; color: string }> = {
  correct: { bg: COLORS.correctBg, color: COLORS.correctValue },
  partial: { bg: COLORS.partialBg, color: COLORS.partialValue },
  wrong: { bg: COLORS.wrongBg, color: COLORS.wrongValue },
};

export function Chip({ name, tone }: { name: string; tone: ChipTone }) {
  const c = CHIP_STYLE[tone];
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "3px 9px",
        background: c.bg,
        color: c.color,
        fontFamily: FONT_FAMILY,
      }}
    >
      {name}
    </span>
  );
}
