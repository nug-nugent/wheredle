import type { GuessRecord } from "./engine";
import { FactCard } from "../shell/FactCard";
import { RailList } from "../shell/RailList";

// Classic mode's rail: the countries already spent, newest first, so the
// one just played is the one the eye lands on and the strip on a phone
// opens on it rather than on the oldest. Each card is numbered because that
// ordering is the opposite of the way they were made.
//
// A guess here is simply right or wrong, so the cards are green or red —
// no grey, since classic mode has no exclusions to draw: the clues tell the
// player what the country *is*, and a wrong guess is a miss rather than a
// fact established.
export function GuessRail({
  guesses,
  layout = "column",
}: {
  guesses: GuessRecord[];
  layout?: "column" | "row" | "grid";
}) {
  const numbered = guesses.map((guess, i) => ({ guess, number: i + 1 })).reverse();

  return (
    <RailList layout={layout} empty={{ short: "No guesses yet.", long: "No guesses yet — take one." }}>
      {numbered.map(({ guess, number }) => (
        <FactCard
          key={guess.country.cca3}
          header={`Guess ${number}`}
          label={guess.country.name}
          layout={layout === "column" ? "column" : "row"}
          tone={guess.correct ? "correct" : "wrong"}
        />
      ))}
    </RailList>
  );
}
