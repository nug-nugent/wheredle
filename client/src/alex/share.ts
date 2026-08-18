import { CATEGORIES } from "./categories";
import { MAX_GUESSES, type AlexGameState, type GuessFeedback } from "./engine";

// +1 for language, which lives outside CATEGORIES since it's a chip list
// rather than a single tile.
const TOTAL_CATEGORIES = CATEGORIES.length + 1;

function warmth(feedback: GuessFeedback): "🟩" | "🟨" | "⬛" {
  if (feedback.correct) return "🟩";

  const languageConfirmed = feedback.languageChips.some((c) => c.state === "correct");
  const matched =
    CATEGORIES.filter((c) => c.flag(feedback) === "correct").length + (languageConfirmed ? 1 : 0);

  return matched / TOTAL_CATEGORIES >= 0.5 ? "🟨" : "⬛";
}

export function buildAlexShare(state: AlexGameState): { resultLabel: string; rows: string[] } {
  // state.guesses is newest-first; share rows read oldest-first, matching
  // the order the guesses were actually made in.
  const rows = [...state.guesses].reverse().map(warmth);
  const resultLabel =
    state.status === "won" ? `Solved in ${state.guesses.length}` : `${state.guesses.length}/${MAX_GUESSES}`;
  return { resultLabel, rows };
}
