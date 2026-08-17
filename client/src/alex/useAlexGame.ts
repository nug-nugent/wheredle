import { useCallback, useState } from "react";
import type { Country } from "../data/country";
import {
  pickRandomCountry,
  startAlexGame,
  submitAlexGuess,
  type AlexGameState,
} from "./engine";

export function useAlexGame() {
  const [state, setState] = useState<AlexGameState>(() => startAlexGame(pickRandomCountry()));

  const guess = useCallback((country: Country) => {
    setState((s) => submitAlexGuess(s, country));
  }, []);

  const newGame = useCallback(() => {
    setState(startAlexGame(pickRandomCountry()));
  }, []);

  return { state, guess, newGame };
}
