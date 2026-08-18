import type { ConfirmedFact } from "./categories";
import { COLORS, FONT_FAMILY } from "../theme";

// Renders the same list two ways: a vertical rail on desktop, a horizontal
// scrolling strip on mobile — see the two usages in AlexApp.
export function ConfirmedFacts({
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
        Nothing confirmed yet.
      </div>
    ) : (
      <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: FONT_FAMILY }}>Nothing confirmed yet.</div>
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
        <div
          key={fact.key}
          style={{
            background: COLORS.accent,
            padding: direction === "row" ? "8px 10px" : "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: direction === "row" ? 2 : 3,
            flex: "none",
            minWidth: direction === "row" ? 96 : undefined,
            fontFamily: FONT_FAMILY,
          }}
        >
          <span
            style={{
              fontSize: direction === "row" ? 9 : 10,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {fact.header}
          </span>
          <span
            style={{
              fontSize: direction === "row" ? 12 : 14,
              fontWeight: 800,
              color: "#fff2ef",
              whiteSpace: direction === "row" ? "nowrap" : undefined,
            }}
          >
            {fact.label}
          </span>
        </div>
      ))}
    </div>
  );
}
