import { useCallback, useState } from "react";
import { countries, type Country } from "../data/country";
import {
  chooseHint as chooseHintImpl,
  pendingChoice,
  startGame,
  submitGuess as submitGuessImpl,
  type ChoosableHintType,
  type GameState,
} from "./engine";

export function pickRandomCountry(): Country {
  return countries[Math.floor(Math.random() * countries.length)];
}

export function useGame() {
  const [state, setState] = useState<GameState>(() => startGame(pickRandomCountry()));

  const guess = useCallback(
    (country: Country) => {
      const target = state.target;
      void submitGuessImpl(state, country).then((next) => {
        // Ignore a stale resolution if the game was reset while this guess
        // (which may have been sampling a flag image) was still in flight.
        setState((current) => (current.target === target ? next : current));
      });
    },
    [state]
  );

  const chooseHint = useCallback((hint: ChoosableHintType) => {
    setState((s) => chooseHintImpl(s, hint));
  }, []);

  const newGame = useCallback(() => {
    setState(startGame(pickRandomCountry()));
  }, []);

  return {
    state,
    guess,
    chooseHint,
    newGame,
    choiceOptions: pendingChoice(state),
  };
}
