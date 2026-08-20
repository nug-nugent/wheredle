import type { ChoosableHintType } from "./engine";
import { COLORS, FONT_FAMILY } from "../theme";

const LABELS: Record<ChoosableHintType, string> = {
  continent: "Continent",
  population: "Population",
  language: "Languages",
};

// Takes the guess field's place in the toolbar while the game is waiting on
// a clue to be picked, so it matches that row's height — the toolbar keeps
// its size as the game switches between asking for one and asking for the
// other, rather than jolting the column below it up and down.
export function ChoicePrompt({
  options,
  onChoose,
}: {
  options: ChoosableHintType[];
  onChoose: (hint: ChoosableHintType) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontFamily: FONT_FAMILY }}>
      <span style={{ fontSize: 13, color: COLORS.textDimmed }}>Pick your next clue:</span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChoose(opt)}
          style={{
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 14,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.inputBg,
            color: COLORS.text,
            padding: "8px 16px",
            minHeight: 40,
            cursor: "pointer",
          }}
        >
          {LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
