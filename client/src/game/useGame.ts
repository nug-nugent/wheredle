import { useCallback, useEffect, useState } from "react";
import { countries, type Country } from "../data/country";
import { loadState, saveState } from "../storage";
import {
  chooseHint as chooseHintImpl,
  pendingChoice,
  startGame,
  submitGuess as submitGuessImpl,
  type ChoosableHintType,
  type GameState,
} from "./engine";

const STORAGE_KEY = "wheredle:game";

export function pickRandomCountry(): Country {
  return countries[Math.floor(Math.random() * countries.length)];
}

function initialState(): GameState {
  const stored = loadState<GameState>(STORAGE_KEY);
  if (stored && countries.some((c) => c.cca3 === stored.target.cca3)) return stored;
  return startGame(pickRandomCountry());
}

export function useGame() {
  const [state, setState] = useState<GameState>(initialState);

  useEffect(() => {
    saveState(STORAGE_KEY, state);
  }, [state]);

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
