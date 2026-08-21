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
        transition: "color 240ms ease, border-color 240ms ease",
        animation: lastGuess ? "guess-countdown-pulse 1.1s ease-out infinite" : undefined,
      }}
    >
      {/* Keyed on remaining so the label remounts, and its pop animation
          replays, on every guess — not just the final one. */}
      <span key={remaining} style={{ display: "inline-block", animation: "guess-countdown-pop 320ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
        {label.toUpperCase()}
      </span>
    </div>
  );
}
