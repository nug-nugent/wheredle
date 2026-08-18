import type { GuessFeedback } from "./engine";
import { GuessHistoryRow } from "./GuessHistoryRow";
import { LatestGuessCard } from "./LatestGuessCard";
import { COLORS, FONT_FAMILY } from "../theme";

// The most recent guess (in-flight or just-settled) is always shown in
// full; everything before it collapses to a dot-summary row you can expand.
export function GuessHistory({
  guesses,
  pendingGuess,
  onRevealComplete,
}: {
  guesses: GuessFeedback[];
  pendingGuess?: GuessFeedback | null;
  onRevealComplete?: (feedback: GuessFeedback) => void;
}) {
  const latest = pendingGuess ?? guesses[0];

  if (!latest) {
    return (
      <div style={{ fontSize: 13, color: COLORS.textFaint, padding: "24px 4px", fontFamily: FONT_FAMILY }}>
        No guesses yet — start above.
      </div>
    );
  }

  const rest = pendingGuess ? guesses : guesses.slice(1);

  return (
    <div>
      <LatestGuessCard
        feedback={latest}
        revealing={latest === pendingGuess}
        onRevealComplete={() => pendingGuess && onRevealComplete?.(pendingGuess)}
      />
      {rest.map((feedback) => (
        <GuessHistoryRow key={feedback.country.cca3} feedback={feedback} />
      ))}
    </div>
  );
}
