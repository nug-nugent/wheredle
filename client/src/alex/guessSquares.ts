import { CATEGORIES } from "./categories";
import type { GuessFeedback } from "./engine";

// One square per tile category, then one for language — the per-guess
// summary behind both the history row's dots and the share grid's emoji.
// Deriving both from here is what keeps a shared score reading as the board
// the player was actually looking at.
export type SquareState = "correct" | "partial" | "wrong";

// Language is the one attribute with a halfway state: a guess can share a
// family with something the target speaks without naming it outright.
function languageSquare(feedback: GuessFeedback): SquareState {
  if (feedback.languageChips.some((c) => c.state === "correct")) return "correct";
  if (feedback.languageChips.some((c) => c.state === "family")) return "partial";
  return "wrong";
}

export function guessSquares(feedback: GuessFeedback): SquareState[] {
  return [
    ...CATEGORIES.map((c): SquareState => (c.flag(feedback) === "correct" ? "correct" : "wrong")),
    languageSquare(feedback),
  ];
}
