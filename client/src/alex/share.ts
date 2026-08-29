import type { CategoryDef } from "./categories";
import { MAX_GUESSES, type AlexGameState, type SquareState } from "./engine";
import { guessSquares } from "./guessSquares";

// The board's own traffic light, in emoji: green for a hit, amber for a
// language-family partial, red for a miss. Red rather than the usual black
// because the shared grid is meant to be the history rows the player just
// looked at, and a missed dot there is red.
const SQUARE: Record<SquareState, string> = { correct: "🟩", partial: "🟨", wrong: "🟥" };

export function buildAlexShare(
  state: AlexGameState,
  categories: CategoryDef[]
): { resultLabel: string; rows: string[] } {
  // state.guesses is newest-first; share rows read oldest-first, matching
  // the order the guesses were actually made in.
  const rows = [...state.guesses]
    .reverse()
    .map((feedback) => guessSquares(feedback, categories).map((s) => SQUARE[s]).join(""));
  // X for a loss, as every game of this shape writes it, and as the main
  // game already did. Counting the guesses instead made a lost game share as
  // "6/6" — which reads like a win on the last guess, and is the one score
  // the game can't actually produce that way, since a sixth correct guess
  // shares as "Solved in 6".
  const resultLabel =
    state.status === "won" ? `Solved in ${state.guesses.length}` : `X/${MAX_GUESSES}`;
  return { resultLabel, rows };
}
