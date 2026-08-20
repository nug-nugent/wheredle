import { countdownTint } from "../theme";

// Players track "how much rope have I got left", not "which guess is this",
// so the nav chip counts down rather than reporting a position in a
// sequence. Its colour is the countdown said a second way: green while the
// rope is long, red once it has run out, so a glance registers the state
// before the words are read. The final guess also goes bold, since that is
// the one step where the count changes what a player should do.
export function GuessCountdown({ used, max }: { used: number; max: number }) {
  const remaining = Math.max(max - used, 0);
  const lastGuess = remaining === 1;
  // At one left there is nothing useful to count, so the chip names the
  // moment instead of measuring it.
  const label = lastGuess ? "final guess" : `${remaining} guesses left`;
  const colour = countdownTint((max - remaining) / (max - 1));

  return (
    <div
      style={{
        border: `1px solid ${colour}`,
        color: colour,
        fontSize: 11,
        fontWeight: lastGuess ? 800 : 400,
        letterSpacing: "0.04em",
        padding: "5px 12px",
        whiteSpace: "nowrap",
      }}
    >
      {label.toUpperCase()}
    </div>
  );
}
