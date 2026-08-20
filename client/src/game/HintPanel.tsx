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
      return <span style={{ fontWeight: 800, fontSize: 18 }}>{hint.letter}</span>;
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
      return <span style={{ fontWeight: 800, fontSize: 18 }}>{target.population.toLocaleString("en-GB")}</span>;
    case "language":
      return <span style={{ fontWeight: 800, fontSize: 18 }}>{target.languages.join(", ")}</span>;
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

// The clues so far, newest first: the one just earned is the reason the
// player is looking at this column at all, so it sits at the top in a card
// of its own and the ones already read fall in below it, each ruled off.
// It's the shape Alex mode's guess history takes, for the same reason — but
// no clue ever collapses, since unlike a spent guess every one of them is
// still live information.
export function HintPanel({ hints, target }: { hints: Hint[]; target: Country }) {
  const numbered = hints.map((hint, i) => ({ hint, number: i + 1 })).reverse();

  return (
    <div style={{ fontFamily: FONT_FAMILY }}>
      {numbered.map(({ hint, number }, i) => {
        const latest = i === 0;
        return (
          <div
            key={number}
            style={
              latest
                ? { border: `1px solid ${COLORS.border}`, padding: 12, marginBottom: 12 }
                : { borderBottom: `1px solid ${COLORS.borderFaint}`, padding: "10px 4px" }
            }
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: COLORS.textDimmed,
                marginBottom: 6,
              }}
            >
              Clue {number} — {LABELS[hint.type]}
            </div>
            <HintValue hint={hint} target={target} />
          </div>
        );
      })}
    </div>
  );
}
