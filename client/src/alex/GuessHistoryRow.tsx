import { useState } from "react";
import { CATEGORIES } from "./categories";
import type { GuessFeedback } from "./engine";
import { LanguageBox } from "./LanguageBox";
import { COLORS, FONT_FAMILY } from "../theme";
import { TileGrid } from "./TileGrid";

// One dot per tile, plus one for language — a compact summary of a settled
// guess, click to expand into the full tile grid plus language chips.
function dotColors(feedback: GuessFeedback): string[] {
  const tileDots = CATEGORIES.map((c) => (c.flag(feedback) === "correct" ? COLORS.correctBg : COLORS.wrongBorder));

  const languageConfirmed = feedback.languageChips.some((c) => c.state === "correct");
  const languagePartial = feedback.languageChips.some((c) => c.state === "family");

  return [
    ...tileDots,
    languageConfirmed ? COLORS.correctBg : languagePartial ? COLORS.partialSolid : COLORS.wrongBorder,
  ];
}

export function GuessHistoryRow({ feedback }: { feedback: GuessFeedback }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: `1px solid ${COLORS.borderFaint}`, fontFamily: FONT_FAMILY }}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", cursor: "pointer" }}
      >
        <div style={{ fontWeight: 600, fontSize: 14, minWidth: 170 }}>{feedback.country.name}</div>
        <div style={{ display: "flex", gap: 3 }}>
          {dotColors(feedback).map((color, i) => (
            <span key={i} style={{ width: 8, height: 8, background: color, flex: "none" }} />
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
          <TileGrid feedback={feedback} />
          <LanguageBox chips={feedback.languageChips} />
        </div>
      )}
    </div>
  );
}
