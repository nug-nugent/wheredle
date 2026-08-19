import { useCallback, useEffect, useState } from "react";
import { countries, type Country } from "../data/country";
import { loadState, saveState } from "../storage";
import {
  applyGuessFeedback,
  computeGuessFeedback,
  pickRandomCountry,
  startAlexGame,
  type AlexGameState,
  type GuessFeedback,
} from "./engine";

const STORAGE_KEY = "wheredle:alex";

function initialState(): AlexGameState {
  const stored = loadState<AlexGameState>(STORAGE_KEY);
  if (stored && countries.some((c) => c.cca3 === stored.target.cca3)) return stored;
  return startAlexGame(pickRandomCountry());
}

export function useAlexGame() {
  const [state, setState] = useState<AlexGameState>(initialState);
  // A guess that's been computed but not yet folded into `state` — it sits
  // here while the reveal ceremony plays, then commitGuess applies it.
  // Deliberately not persisted: on reload it just resolves straight into
  // the already-committed guess list, skipping the reveal animation.
  const [pendingGuess, setPendingGuess] = useState<GuessFeedback | null>(null);

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

  const guess = useCallback(
    (country: Country) => {
      if (state.status !== "playing" || pendingGuess) return;
      if (state.guesses.some((g) => g.country.cca3 === country.cca3)) return;
      setPendingGuess(computeGuessFeedback(state, country));
    },
    [state, pendingGuess]
  );

  const commitGuess = useCallback((feedback: GuessFeedback) => {
    setState((s) => applyGuessFeedback(s, feedback));
    setPendingGuess(null);
  }, []);

  const newGame = useCallback(() => {
    setState(startAlexGame(pickRandomCountry()));
    setPendingGuess(null);
  }, []);

  return { state, pendingGuess, guess, commitGuess, newGame };
}
