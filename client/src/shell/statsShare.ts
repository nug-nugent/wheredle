import type { Stats } from "../stats";
import { distributionRows, statFigures } from "./statsLayout";

// The widest a bar gets, in squares. Ten leaves room on a phone-width
// WhatsApp bubble for the row label and the count without the bar wrapping,
// which would break the chart into two lines where it's meant to be one.
const BAR_SQUARES = 10;

// Keycap digits for the row labels rather than plain numerals, because a
// plain "1" followed by a plain count of 0 reads as "10" once the bar between
// them is empty. Past ten there's no keycap to use, which no mode reaches.
const KEYCAPS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

// The Statistics modal as text, for pasting into a chat.
//
// It follows the modal line for line: the five figures, then the chart. What's
// shared is the player's whole record, so no bar is singled out for the game
// just finished the way the modal marks it — wins are green and losses red
// throughout, the colours the modal uses for a hit and a miss. A zero draws
// no bar at all, as in the modal. Bars are scaled to the busiest row, as the modal's are, but
// never shrink a played row to nothing — at ten squares a single game
// against a peak of thirty would otherwise round away.
export function buildStatsShare(
  stats: Stats,
  maxGuesses: number
): { resultLabel: string; rows: string[] } {
  const figures = statFigures(stats).map(({ value, label }) => `${label} ${value}`);
  const rows = distributionRows(stats, maxGuesses);
  const peak = Math.max(1, ...rows.map((row) => row.count));

  const chart = rows.map((row) => {
    const squares = row.count === 0 ? 0 : Math.max(1, Math.round((row.count / peak) * BAR_SQUARES));
    const square = row.won ? "🟩" : "🟥";
    const label = row.won ? KEYCAPS[Number(row.label) - 1] ?? row.label : "❌";
    return [label, square.repeat(squares), String(row.count)].filter(Boolean).join(" ");
  });

  return {
    resultLabel: "Statistics",
    rows: [figures.slice(0, 3).join(" · "), figures.slice(3).join(" · "), "", "Guesses taken", ...chart],
  };
}
