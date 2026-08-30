import { useCallback, useEffect, useState } from "react";
import { countries, type Country } from "../data/country";
import { dayNumber } from "../daily";
import { useDailyStats } from "../useDailyStats";
import { dailyTarget, randomCountry } from "../dailyTarget";
import { clearPractice, loadDaily, loadPractice, saveDaily, savePractice } from "../storage";
import { DAILY_TARGET_POOL, dailyBoard } from "./dailyBoard";
import {
  applyGuessFeedback,
  computeGuessFeedback,
  startAlexGame,
  type AlexGameState,
  type GuessFeedback,
} from "./engine";

const MODE = "alex";
const DAILY_KEY = "wheredle:alex";
const PRACTICE_KEY = "wheredle:alex:practice";
const STATS_KEY = "wheredle:alex:stats";

// The answer is drawn first and the board second, so the day can be given a
// board that's actually able to single that answer out — see dailyBoard.
function startDaily(day: number): AlexGameState {
  const target = dailyTarget(MODE, day, DAILY_TARGET_POOL);
  return startAlexGame(
    target,
    dailyBoard(day, target).map((c) => c.key)
  );
}

// Practice draws from every country, including the handful the daily pool
// leaves out — with a random board there's no promise of a fair puzzle to
// keep, and the alternative is a country that can never come up at all.
function startPractice(): AlexGameState {
  const target = randomCountry();
  return startAlexGame(
    target,
    dailyBoard(Math.floor(Math.random() * 1e9), target).map((c) => c.key)
  );
}

// A stored game is only resumed if it still names a country the dataset has —
// a regenerated countries.json can drop one out from under a game in
// progress. Whether it's still today's is loadDaily's business, not this
// one's.
// Exported for scripts/check-saves.mjs, which feeds it saves degraded the
// ways real deploys have degraded them and asserts it rebuilds rather than
// passing the stale copy through. Nothing else outside this file calls it.
export function resume(stored: AlexGameState | null): AlexGameState | null {
  if (!stored) return null;
  // A save from before the board was recorded, or one whose categories have
  // all since been renamed, has nothing to draw.
  if (!stored.categoryKeys?.length) return null;

  // Nothing derived is trusted from the save — only which countries were
  // involved. A game is stored as whole Country objects and whole
  // GuessFeedback objects, both of which go stale the moment either shape
  // changes: adding climateZones to the dataset, and then splitting
  // sameClimate into climateMatch, each shipped a build that crashed on
  // resume reading a field the saved copy predated. Rebuilding from the
  // codes makes the save immune to both, and recovers a game in progress
  // rather than discarding it the way a version bump would.
  const target = countries.find((c) => c.cca3 === stored.target?.cca3);
  if (!target) return null;

  const guessed = (stored.guesses ?? []).map((g) => countries.find((c) => c.cca3 === g.country?.cca3));
  if (guessed.some((c) => c === undefined)) return null;

  return {
    ...stored,
    target,
    guesses: guessed.map((c) => computeGuessFeedback(target, c!)),
  };
}

export function useAlexGame() {
  // Read once on mount rather than per render: a player crossing midnight
  // mid-game keeps the board they're on, and meets the new one when they next
  // open the page.
  const [day] = useState(dayNumber);
  const [state, setState] = useState<AlexGameState>(
    () => resume(loadDaily<AlexGameState>(DAILY_KEY, day)) ?? startDaily(day)
  );
  // A practice game runs alongside the daily one rather than replacing it, so
  // starting one can't cost the player their day's progress.
  const [practice, setPractice] = useState<AlexGameState | null>(() =>
    resume(loadPractice<AlexGameState>(PRACTICE_KEY))
  );
  // A guess that's been computed but not yet folded into state — it sits here
  // while the reveal ceremony plays, then commitGuess applies it.
  // Deliberately not persisted: on reload it just resolves straight into the
  // already-committed guess list, skipping the reveal animation.
  const [pendingGuess, setPendingGuess] = useState<GuessFeedback | null>(null);

  const playing = practice ?? state;
  // Always the daily game's outcome, never the practice one's: a streak
  // means turning up each day, which a practice board says nothing about.
  const stats = useDailyStats(STATS_KEY, day, state.status === "playing" ? null : state.status, state.guesses.length);

  useEffect(() => {
    saveDaily(DAILY_KEY, day, state);
  }, [day, state]);

  useEffect(() => {
    if (practice) savePractice(PRACTICE_KEY, practice);
  }, [practice]);

  const guess = useCallback(
    (country: Country) => {
      if (playing.status !== "playing" || pendingGuess) return;
      if (playing.guesses.some((g) => g.country.cca3 === country.cca3)) return;
      setPendingGuess(computeGuessFeedback(playing.target, country));
    },
    [playing, pendingGuess]
  );

  const commitGuess = useCallback(
    (feedback: GuessFeedback) => {
      if (practice) setPractice((p) => (p ? applyGuessFeedback(p, feedback) : p));
      else setState((s) => applyGuessFeedback(s, feedback));
      setPendingGuess(null);
    },
    [practice]
  );

  const newPractice = useCallback(() => {
    setPractice(startPractice());
    setPendingGuess(null);
  }, []);

  const exitPractice = useCallback(() => {
    setPractice(null);
    setPendingGuess(null);
    clearPractice(PRACTICE_KEY);
  }, []);

  return {
    state: playing,
    day,
    stats,
    isPractice: practice !== null,
    pendingGuess,
    guess,
    commitGuess,
    newPractice,
    exitPractice,
  };
}
