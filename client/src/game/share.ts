import { MAX_GUESSES, type GameState } from "./engine";

// A guess here is simply right or wrong — there's no partial credit to
// show — so the grid is one square per guess, in the same green and red
// the guess chips below the board wear.
export function buildWheredleShare(state: GameState): { resultLabel: string; rows: string[] } {
  const rows = state.guesses.map((g) => (g.correct ? "🟩" : "🟥"));
  const resultLabel =
    state.status === "won" ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  return { resultLabel, rows };
}
