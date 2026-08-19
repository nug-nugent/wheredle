import type { ChoosableHintType } from "./engine";
import { COLORS, FONT_FAMILY } from "../theme";

const LABELS: Record<ChoosableHintType, string> = {
  continent: "Continent",
  population: "Population",
  language: "Languages",
};

export function ChoicePrompt({
  options,
  onChoose,
}: {
  options: ChoosableHintType[];
  onChoose: (hint: ChoosableHintType) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontFamily: FONT_FAMILY }}>
      <span style={{ fontSize: 13, color: COLORS.textDimmed }}>Pick your next hint:</span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChoose(opt)}
          style={{
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: 13,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.inputBg,
            color: COLORS.text,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          {LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
