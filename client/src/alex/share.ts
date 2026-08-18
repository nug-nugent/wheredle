import { CATEGORIES, isLanguageConfirmed } from "./categories";
import type { AlexGameState, GuessFeedback } from "./engine";

// +1 for the language-family category, which lives outside CATEGORIES
// because it's matched by depth rather than a simple boolean.
const TOTAL_CATEGORIES = CATEGORIES.length + 1;

function warmth(feedback: GuessFeedback): "🟩" | "🟨" | "⬛" {
  if (feedback.correct) return "🟩";
  const matched =
    CATEGORIES.filter((c) => c.match(feedback)).length + (isLanguageConfirmed(feedback) ? 1 : 0);
  return matched / TOTAL_CATEGORIES >= 0.5 ? "🟨" : "⬛";
}

export function buildAlexShare(state: AlexGameState): { resultLabel: string; rows: string[] } {
  // state.guesses is newest-first; share rows read oldest-first, matching
  // the order the guesses were actually made in.
  const rows = [...state.guesses].reverse().map(warmth);
  const resultLabel = `Solved in ${state.guesses.length}`;
  return { resultLabel, rows };
}
