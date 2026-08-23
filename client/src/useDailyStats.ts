import { useEffect, useState } from "react";
import { readStats, recordResult, writeStats, type Stats } from "./stats";

// A mode's running record, folding in each daily game as it finishes.
//
// `outcome` is null while a game is still going, and also for practice games,
// which are deliberately unrecorded: a streak means "turned up every day",
// and a practice board proves nothing about that.
export function useDailyStats(key: string, day: number, outcome: "won" | "lost" | null, guessCount: number): Stats {
  const [stats, setStats] = useState<Stats>(() => readStats(key));

  useEffect(() => {
    if (!outcome) return;
    // recordResult is a no-op once this day is in, so a reload of a finished
    // board doesn't count it again.
    setStats((current) => recordResult(current, day, outcome === "won", guessCount));
  }, [day, outcome, guessCount]);

  // Persisting is its own effect so the updater above stays pure — React can
  // call it more than once for a single update.
  useEffect(() => {
    writeStats(key, stats);
  }, [key, stats]);

  return stats;
}
