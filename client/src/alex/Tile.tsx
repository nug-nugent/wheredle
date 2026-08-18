import { COLORS, FONT_FAMILY } from "../theme";
import type { TileFlag } from "./engine";

export type TileState = TileFlag | "pending";

const ICON_PATH: Record<TileFlag, string> = {
  correct: "M20 6 9 17l-5-5",
  wrong: "M18 6 6 18M6 6l12 12",
  up: "M12 19V5M5 12l7-7 7 7",
  down: "M12 5v14M19 12l-7 7-7-7",
};

const ICON_STROKE_WIDTH: Record<TileFlag, number> = { correct: 3.5, wrong: 3, up: 3, down: 3 };

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
  up: {
    bg: COLORS.directionBg,
    border: COLORS.directionBorder,
    label: COLORS.directionLabel,
    value: COLORS.directionValue,
    icon: COLORS.directionIcon,
  },
  down: {
    bg: COLORS.directionBg,
    border: COLORS.directionBorder,
    label: COLORS.directionLabel,
    value: COLORS.directionValue,
    icon: COLORS.directionIcon,
  },
  pending: {
    bg: COLORS.inputBg,
    border: COLORS.borderFaint,
    label: COLORS.textFaint,
    value: COLORS.textFaint,
    icon: "transparent",
  },
};

export function Tile({ label, value, state }: { label: string; value: string; state: TileState }) {
  const c = TILE_STYLE[state];
  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        background: c.bg,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 128,
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
    </div>
  );
}
