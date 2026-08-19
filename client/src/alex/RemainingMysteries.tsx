import type { ConfirmedFact } from "./categories";
import { FactCard } from "./FactCard";
import { COLORS, FONT_FAMILY } from "../theme";

// Bounds narrowed from "up"/"down" guesses on attributes that aren't
// confirmed yet — e.g. "< 5" once a 5-border guess has come back "down".
// Same column/row split as ConfirmedFacts — see the two usages in AlexApp.
export function RemainingMysteries({
  facts,
  direction = "column",
}: {
  facts: ConfirmedFact[];
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
        No bounds narrowed down yet.
      </div>
    ) : (
      <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: FONT_FAMILY }}>No bounds narrowed down yet.</div>
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
        <FactCard key={fact.key} header={fact.header} label={fact.label} layout={direction} tone="direction" />
      ))}
    </div>
  );
}
