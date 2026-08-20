import { MAX_GUESSES, type AlexGameState } from "./engine";
import { guessSquares, type SquareState } from "./guessSquares";

// The board's own traffic light, in emoji: green for a hit, amber for a
// language-family partial, red for a miss. Red rather than the usual black
// because the shared grid is meant to be the history rows the player just
// looked at, and a missed dot there is red.
const SQUARE: Record<SquareState, string> = { correct: "🟩", partial: "🟨", wrong: "🟥" };

export function buildAlexShare(state: AlexGameState): { resultLabel: string; rows: string[] } {
  // state.guesses is newest-first; share rows read oldest-first, matching
  // the order the guesses were actually made in.
  const rows = [...state.guesses]
    .reverse()
    .map((feedback) => guessSquares(feedback).map((s) => SQUARE[s]).join(""));
  const resultLabel =
    state.status === "won" ? `Solved in ${state.guesses.length}` : `${state.guesses.length}/${MAX_GUESSES}`;
  return { resultLabel, rows };
}
