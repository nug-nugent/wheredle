import type { CategoryDef } from "./categories";
import type { GuessFeedback, SquareState } from "./engine";

// One square per category on the day's board — the per-guess summary behind
// both the history row's dots and the share grid's emoji. Deriving both from
// here is what keeps a shared score reading as the board the player was
// actually looking at, down to how many squares a row has, now that which
// categories are in play varies by day.
export function guessSquares(feedback: GuessFeedback, categories: CategoryDef[]): SquareState[] {
  return categories.map((category) => category.square(feedback));
}
