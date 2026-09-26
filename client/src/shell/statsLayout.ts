import { averageGuesses, type Stats } from "../stats";

// What the Statistics modal shows, worked out apart from the drawing so the
// shared copy of it (statsShare.ts) quotes exactly what the modal shows.
// highlightedRow is the modal's alone: a shared record marks no one game.

// The five figures along the top of the modal, in the order they're drawn.
export function statFigures(stats: Stats): { value: string; label: string }[] {
  const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
  const average = averageGuesses(stats);

  return [
    { value: String(stats.played), label: "Played" },
    { value: `${winRate}%`, label: "Won" },
    { value: average === null ? "—" : average.toFixed(1), label: "Avg guesses" },
    { value: String(stats.currentStreak), label: "Streak" },
    { value: String(stats.maxStreak), label: "Best streak" },
  ];
}

export interface DistributionRow {
  key: string;
  label: string;
  count: number;
  won: boolean;
}

// One row per winning guess count, then one for games lost.
//
// Losses are derived rather than recorded — they're what's left of `played`
// once the wins are taken out — but they belong on the chart: without them
// the bars only account for the games that were won, and a record of 20
// played would draw as 12.
//
// Anything recorded past the current limit folds into the last row instead of
// vanishing. That only happens if a mode's guess limit is ever lowered, and a
// game genuinely won is better shown slightly wrong than not at all.
export function distributionRows(stats: Stats, maxGuesses: number): DistributionRow[] {
  const wins = new Array<number>(maxGuesses).fill(0);
  stats.distribution.forEach((count, index) => {
    wins[Math.min(index, maxGuesses - 1)] += count;
  });

  return [
    ...wins.map((count, i) => ({ key: String(i + 1), label: String(i + 1), count, won: true })),
    { key: "lost", label: "X", count: Math.max(0, stats.played - stats.wins), won: false },
  ];
}

// The row the game just finished lands in, or null when there isn't one.
export function highlightedRow(
  latest: { won: boolean; guessCount: number } | null,
  maxGuesses: number
): string | null {
  if (latest === null) return null;
  return latest.won ? String(Math.min(latest.guessCount, maxGuesses)) : "lost";
}
