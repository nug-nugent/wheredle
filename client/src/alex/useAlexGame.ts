import { useCallback, useState } from "react";
import type { Country } from "../data/country";
import {
  applyGuessFeedback,
  computeGuessFeedback,
  pickRandomCountry,
  startAlexGame,
  type AlexGameState,
  type GuessFeedback,
} from "./engine";

export function useAlexGame() {
  const [state, setState] = useState<AlexGameState>(() => startAlexGame(pickRandomCountry()));
  // A guess that's been computed but not yet folded into `state` — it sits
  // here while the reveal ceremony plays, then commitGuess applies it.
  const [pendingGuess, setPendingGuess] = useState<GuessFeedback | null>(null);
  const [lastGuess, setLastGuess] = useState<GuessFeedback | null>(null);

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
    setLastGuess(feedback);
    setPendingGuess(null);
  }, []);

  const newGame = useCallback(() => {
    setState(startAlexGame(pickRandomCountry()));
    setPendingGuess(null);
    setLastGuess(null);
  }, []);

  return { state, pendingGuess, lastGuess, guess, commitGuess, newGame };
}
