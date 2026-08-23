import { useState } from "react";
import type { CategoryDef } from "./categories";
import type { GuessFeedback, SquareState } from "./engine";
import { guessSquares } from "./guessSquares";
import { COLORS, FONT_FAMILY } from "../theme";
import { TileGrid } from "./TileGrid";

// One dot per category on the day's board — a compact summary of a settled
// guess, click to expand into the full grid. The same squares are what a
// shared score grid is built from.
const DOT_COLOR: Record<SquareState, string> = {
  correct: COLORS.correctBg,
  partial: COLORS.partialSolid,
  wrong: COLORS.wrongBorder,
};

export function GuessHistoryRow({
  feedback,
  categories,
}: {
  feedback: GuessFeedback;
  categories: CategoryDef[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: `1px solid ${COLORS.borderFaint}`, fontFamily: FONT_FAMILY }}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", cursor: "pointer" }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, minWidth: 170 }}>{feedback.country.name}</div>
        <div style={{ display: "flex", gap: 3 }}>
          {guessSquares(feedback, categories).map((state, i) => (
            <span key={i} style={{ width: 8, height: 8, background: DOT_COLOR[state], flex: "none" }} />
          ))}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#605d5d"
          strokeWidth={2.5}
          style={{ marginLeft: "auto", flex: "none", transform: `rotate(${expanded ? 180 : 0}deg)` }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {expanded && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 4px 12px" }}>
          <TileGrid feedback={feedback} categories={categories} />
        </div>
      )}
    </div>
  );
}
