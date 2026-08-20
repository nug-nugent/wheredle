import type { KnownFact } from "./categories";
import { FactCard } from "../shell/FactCard";
import { RailList } from "../shell/RailList";

// Alex mode's knowledge rail: everything the guesses have established about
// the target, positives (green) above exclusions (grey). How a fact was
// learnt deliberately isn't encoded — a tertile pinned down by eliminating
// the other two is as certain as one matched outright, and the distinction
// wouldn't change the player's next guess. RailList lays the same cards out
// three ways for the rail, the strip and the pinned strip.
export function KnownFacts({ facts, layout = "column" }: { facts: KnownFact[]; layout?: "column" | "row" | "grid" }) {
  return (
    <RailList
      layout={layout}
      empty={{ short: "Nothing known yet.", long: "Nothing known yet — take a guess." }}
    >
      {facts.map((fact) => (
        <FactCard
          key={fact.key}
          header={fact.header}
          label={fact.label}
          layout={layout === "column" ? "column" : "row"}
          tone={fact.kind === "is" ? "correct" : "excluded"}
        />
      ))}
    </RailList>
  );
}
