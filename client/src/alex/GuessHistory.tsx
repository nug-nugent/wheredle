import type { CategoryDef } from "./categories";
import type { GuessFeedback } from "./engine";
import { GuessHistoryRow } from "./GuessHistoryRow";
import { LatestGuessCard } from "./LatestGuessCard";

// The most recent guess (in-flight or just-settled) is always shown in
// full; everything before it collapses to a dot-summary row you can expand.
export function GuessHistory({
  guesses,
  categories,
  pendingGuess,
  onRevealComplete,
}: {
  guesses: GuessFeedback[];
  categories: CategoryDef[];
  pendingGuess?: GuessFeedback | null;
  onRevealComplete?: (feedback: GuessFeedback) => void;
}) {
  const latest = pendingGuess ?? guesses[0];

  if (!latest) {
    return null;
  }

  const rest = pendingGuess ? guesses : guesses.slice(1);

  return (
    <div>
      <LatestGuessCard
        feedback={latest}
        categories={categories}
        revealing={latest === pendingGuess}
        onRevealComplete={() => pendingGuess && onRevealComplete?.(pendingGuess)}
      />
      {rest.map((feedback) => (
        <GuessHistoryRow key={feedback.country.cca3} feedback={feedback} categories={categories} />
      ))}
    </div>
  );
}
