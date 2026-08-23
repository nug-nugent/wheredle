import { useCallback, useEffect, useState } from "react";
import { countries, type Country } from "../data/country";
import { dayNumber } from "../daily";
import { useDailyStats } from "../useDailyStats";
import { dailyTarget, randomCountry } from "../dailyTarget";
import { clearPractice, loadDaily, loadPractice, saveDaily, savePractice } from "../storage";
import {
  chooseHint as chooseHintImpl,
  pendingChoice,
  startGame,
  submitGuess as submitGuessImpl,
  type ChoosableHintType,
  type GameState,
} from "./engine";

const MODE = "wheredle";
const DAILY_KEY = "wheredle:game";
const PRACTICE_KEY = "wheredle:game:practice";
const STATS_KEY = "wheredle:game:stats";

function startDaily(day: number): GameState {
  return startGame(dailyTarget(MODE, day), `${MODE}:${day}`);
}

// A stored game is only resumed if it still names a country the dataset has —
// a regenerated countries.json can drop one out from under a game in
// progress — and carries the seed its clues were built from. Whether it's
// still today's is loadDaily's business, not this one's.
function resume(stored: GameState | null): GameState | null {
  if (!stored) return null;
  if (!stored.seed) return null;
  return countries.some((c) => c.cca3 === stored.target.cca3) ? stored : null;
}

function initialState(day: number): GameState {
  return resume(loadDaily<GameState>(DAILY_KEY, day)) ?? startDaily(day);
}

export function useGame() {
  // Read once on mount rather than per render: a player crossing midnight
  // mid-game keeps the board they're on, and meets the new one when they
  // next open the page.
  const [day] = useState(dayNumber);
  const [state, setState] = useState<GameState>(() => initialState(day));
  // A practice game runs alongside the daily one rather than replacing it, so
  // starting one — and finishing it, or not — can't cost the player their
  // day's progress.
  const [practice, setPractice] = useState<GameState | null>(() => resume(loadPractice<GameState>(PRACTICE_KEY)));

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

  const setPlaying = useCallback(
    (update: (current: GameState) => GameState) => {
      if (practice) setPractice((p) => (p ? update(p) : p));
      else setState(update);
    },
    [practice]
  );

  const guess = useCallback(
    (country: Country) => {
      const target = playing.target;
      void submitGuessImpl(playing, country).then((next) => {
        // Ignore a stale resolution if the game was swapped while this guess
        // (which may have been sampling a flag image) was still in flight.
        setPlaying((current) => (current.target === target ? next : current));
      });
    },
    [playing, setPlaying]
  );

  const chooseHint = useCallback(
    (hint: ChoosableHintType) => {
      setPlaying((s) => chooseHintImpl(s, hint));
    },
    [setPlaying]
  );

  // Practice games are seeded from the clock rather than the day, so each one
  // reveals a different letter and crop even on the same country.
  const newPractice = useCallback(() => {
    setPractice(startGame(randomCountry(), `${MODE}:practice:${Date.now()}`));
  }, []);

  const exitPractice = useCallback(() => {
    setPractice(null);
    clearPractice(PRACTICE_KEY);
  }, []);

  return {
    state: playing,
    day,
    stats,
    isPractice: practice !== null,
    guess,
    chooseHint,
    newPractice,
    exitPractice,
    choiceOptions: pendingChoice(playing),
  };
}
