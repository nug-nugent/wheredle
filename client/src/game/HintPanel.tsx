import type { Country } from "../data/country";
import { COLORS, FONT_FAMILY } from "../theme";
import { BorderOutline } from "./BorderOutline";
import type { Hint } from "./engine";
import { FlagImage } from "./FlagImage";
import { FlagOverview } from "./FlagOverview";
import { FlagSegment } from "./FlagSegment";

const LABELS: Record<Hint["type"], string> = {
  letter: "Contains the letter",
  flagSegment: "Flag segment",
  borderOutline: "Border outline",
  continent: "Continent",
  population: "Population",
  language: "Language(s)",
  fullFlag: "Full flag",
};

function HintValue({ hint, target }: { hint: Hint; target: Country }) {
  switch (hint.type) {
    case "letter":
      return <span style={{ fontWeight: 700, fontSize: 16 }}>{hint.letter}</span>;
    case "flagSegment":
      return (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
          <FlagOverview flagUrl={target.flagUrl} focalX={hint.focalX} focalY={hint.focalY} />
          <FlagSegment flagUrl={target.flagUrl} focalX={hint.focalX} focalY={hint.focalY} />
        </div>
      );
    case "borderOutline":
      return <BorderOutline cca2={target.cca2} />;
    case "continent":
      return (
        <span
          style={{
            border: `1px solid ${COLORS.accent}`,
            color: COLORS.accent,
            fontSize: 11,
            letterSpacing: "0.04em",
            padding: "4px 10px",
            display: "inline-block",
          }}
        >
          {target.continent}
        </span>
      );
    case "population":
      return <span style={{ fontWeight: 700, fontSize: 16 }}>{target.population.toLocaleString()}</span>;
    case "language":
      return <span style={{ fontWeight: 700, fontSize: 16 }}>{target.languages.join(", ")}</span>;
    case "fullFlag":
      return (
        <FlagImage
          flagUrl={target.flagUrl}
          alt="Full flag"
          maxWidth={200}
          maxHeight={120}
          borderColor={COLORS.border}
        />
      );
  }
}

export function HintPanel({ hints, target }: { hints: Hint[]; target: Country }) {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", fontFamily: FONT_FAMILY }}>
      {hints.map((hint, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
          <span style={{ fontSize: 11, color: COLORS.textDimmed }}>
            Clue {i + 1} — {LABELS[hint.type]}
          </span>
          <HintValue hint={hint} target={target} />
        </div>
      ))}
    </div>
  );
}
