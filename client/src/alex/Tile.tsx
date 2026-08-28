import { COLORS, FONT_FAMILY } from "../theme";
import type { TileFlag } from "./engine";

export type TileState = TileFlag | "pending";

const ICON_PATH: Record<TileFlag, string> = {
  correct: "M20 6 9 17l-5-5",
  wrong: "M18 6 6 18M6 6l12 12",
};

const ICON_STROKE_WIDTH: Record<TileFlag, number> = { correct: 3.5, wrong: 3 };

const TILE_STYLE: Record<TileState, { bg: string; border: string; label: string; value: string; icon: string }> = {
  correct: {
    bg: COLORS.correctBg,
    border: COLORS.correctBorder,
    label: COLORS.correctLabel,
    value: COLORS.correctValue,
    icon: COLORS.correctIcon,
  },
  wrong: {
    bg: COLORS.wrongBg,
    border: COLORS.wrongBorder,
    label: COLORS.wrongLabel,
    value: COLORS.wrongValue,
    icon: COLORS.wrongIcon,
  },
  pending: {
    bg: COLORS.inputBg,
    border: COLORS.borderFaint,
    label: COLORS.textFaint,
    value: COLORS.textFaint,
    icon: "transparent",
  },
};

// `detail` is a subordinate second line for a value that doesn't stand on
// its own. Only the tertile categories pass one: "Top third" says nothing
// about where that third begins or ends, and the answer was previously only
// available over in the knowledge rail — which states it in numbers, so
// nothing visibly tied the two together. Carrying the same string here is
// what makes the connection, so keep it identical to the rail's wording
// rather than reformatting it.
export function Tile({
  label,
  value,
  detail,
  state,
}: {
  label: string;
  value: string;
  detail?: string;
  state: TileState;
}) {
  const c = TILE_STYLE[state];
  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        background: c.bg,
        padding: "6px 9px",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minWidth: 112,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: c.label }}>
          {label}
        </span>
        {state !== "pending" && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth={ICON_STROKE_WIDTH[state]}>
            <path d={ICON_PATH[state]} />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color: c.value }}>{value || " "}</span>
      {detail && <span style={{ fontSize: 11, fontWeight: 600, color: c.label }}>{detail}</span>}
    </div>
  );
}
