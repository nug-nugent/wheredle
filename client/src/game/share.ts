import { MAX_GUESSES, type GameState } from "./engine";

export function buildWheredleShare(state: GameState): { resultLabel: string; rows: string[] } {
  const rows = state.guesses.map((g) => (g.correct ? "🟩" : "⬛"));
  const resultLabel =
    state.status === "won" ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  return { resultLabel, rows };
}
