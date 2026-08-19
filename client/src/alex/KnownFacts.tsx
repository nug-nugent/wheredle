import type { KnownFact } from "./categories";
import { FactCard } from "./FactCard";
import { COLORS, FONT_FAMILY } from "../theme";

// The single knowledge rail: everything the guesses have established about
// the target, positives (green) above exclusions (grey). How a fact was
// learnt deliberately isn't encoded — a tertile pinned down by eliminating
// the other two is as certain as one matched outright, and the distinction
// wouldn't change the player's next guess. Renders the same list two ways: a
// vertical rail on desktop, a horizontal scrolling strip on mobile — see the
// two usages in AlexApp.
export function KnownFacts({
  facts,
  direction = "column",
}: {
  facts: KnownFact[];
  direction?: "column" | "row";
}) {
  if (facts.length === 0) {
    return direction === "column" ? (
      <div
        style={{
          border: `1px dashed ${COLORS.borderDashed}`,
          padding: 16,
          fontSize: 12,
          color: COLORS.textFaint,
          fontFamily: FONT_FAMILY,
        }}
      >
        Nothing known yet — take a guess.
      </div>
    ) : (
      <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: FONT_FAMILY }}>Nothing known yet.</div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        gap: 8,
        overflowX: direction === "row" ? "auto" : undefined,
      }}
    >
      {facts.map((fact) => (
        <FactCard
          key={fact.key}
          header={fact.header}
          label={fact.label}
          layout={direction}
          tone={fact.kind === "is" ? "correct" : "excluded"}
        />
      ))}
    </div>
  );
}
