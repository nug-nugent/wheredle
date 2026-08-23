import { loadStats, saveStats } from "./storage";

export interface Stats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  // How many wins took each number of guesses; index 0 is "solved in one".
  // Recorded from the start even though nothing shows it yet, because it
  // can't be reconstructed after the fact.
  distribution: number[];
  // The last day recorded, which is both what makes recording idempotent
  // across reloads and how a streak knows whether it was broken.
  lastDay: number | null;
}

export const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [],
  lastDay: null,
};

// Whole object, versioned, so a future sync is an upload rather than a
// migration — see the note in storage.ts.
//
// The distribution is re-densified on the way in: saves written before
// recordResult filled its gaps have holes in them, which JSON turns into
// nulls, and a null in a number[] would reach anything that later draws it.
export function readStats(key: string): Stats {
  const stored = loadStats<Stats>(key) ?? {};
  const stats = { ...EMPTY_STATS, ...stored };
  return { ...stats, distribution: Array.from(stats.distribution, (count) => count ?? 0) };
}

export function writeStats(key: string, stats: Stats): void {
  saveStats(key, stats);
}

// Mean guesses across solved games, or null before there is one to average.
//
// Denominated on the distribution's own total rather than `wins`, so the two
// halves of the fraction always describe the same set of games — if a change
// to the guess limit ever has to fold or drop distribution entries, this
// stays consistent with whatever survived.
export function averageGuesses(stats: Stats): number | null {
  let games = 0;
  let total = 0;
  stats.distribution.forEach((count, index) => {
    games += count;
    total += (index + 1) * count;
  });
  return games === 0 ? null : total / games;
}

// Fold one finished daily game into a player's record.
//
// Returns the stats unchanged if this day is already in them, which is what
// keeps a reload of a finished board from counting it twice — the guard has
// to live here rather than in the caller, since a finished game is loaded
// back from storage in exactly the state that triggered the recording.
export function recordResult(stats: Stats, day: number, won: boolean, guessCount: number): Stats {
  if (stats.lastDay === day) return stats;

  // A streak continues only from the day immediately before. A loss ends it
  // outright, so yesterday's loss and a week's absence both leave a win
  // starting again from one.
  const continues = won && stats.lastDay === day - 1;
  const currentStreak = won ? (continues ? stats.currentStreak + 1 : 1) : 0;

  // Grown a bucket at a time rather than by assigning past the end, which
  // would leave holes that serialise as nulls — the array has to stay dense
  // for anything that reads across it, not just at the index it lands on.
  const distribution = [...stats.distribution];
  if (won) {
    while (distribution.length < guessCount) distribution.push(0);
    distribution[guessCount - 1] += 1;
  }

  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastDay: day,
  };
}
