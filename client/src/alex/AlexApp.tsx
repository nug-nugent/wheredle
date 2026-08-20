import { useEffect, useRef } from "react";
import { AppShell, MainHeading } from "../shell/AppShell";
import { GameOverPanel } from "../shell/GameOverPanel";
import { GuessCountdown } from "../shell/GuessCountdown";
import { GuessInput } from "../game/GuessInput";
import { getKnownFacts } from "./categories";
import { MAX_GUESSES } from "./engine";
import { GuessHistory } from "./GuessHistory";
import { KnownFacts } from "./KnownFacts";
import { buildAlexShare } from "./share";
import { useAlexGame } from "./useAlexGame";

export default function AlexApp() {
  const { state, pendingGuess, guess, commitGuess, newGame } = useAlexGame();
  const knownFacts = getKnownFacts(state.guesses);
  const inputDisabled = state.status !== "playing" || !!pendingGuess;
  const finished = state.status === "won" || state.status === "lost";
  const historyRef = useRef<HTMLDivElement>(null);

  // The reveal is prepended to a pane the player has usually scrolled down
  // by the last guess, so send them back to the top to meet it.
  useEffect(() => {
    if (finished) historyRef.current?.scrollTo({ top: 0 });
  }, [finished]);

  return (
    <AppShell
      onNewGame={newGame}
      mainRef={historyRef}
      // A countdown has nothing to say once the game is over — the reveal
      // below carries the outcome instead.
      status={!finished && <GuessCountdown used={state.guesses.length} max={MAX_GUESSES} />}
      toolbar={
        !finished && (
          <GuessInput
            onGuess={guess}
            guessedNames={new Set(state.guesses.map((g) => g.country.name))}
            disabled={inputDisabled}
          />
        )
      }
      rail={{
        heading: "What you know",
        render: (layout) => <KnownFacts facts={knownFacts} layout={layout} />,
      }}
    >
      {/* The reveal scrolls with the guesses rather than sitting in fixed
          chrome: it's tall enough (flag, facts, share button) to leave a
          phone with barely a sliver of history underneath it. */}
      {finished && (
        <GameOverPanel
          won={state.status === "won"}
          guessCount={state.guesses.length}
          country={state.target}
          gameLabel="Wheredle: Alex Mode"
          share={buildAlexShare(state)}
        />
      )}
      <MainHeading>Guesses ({state.guesses.length})</MainHeading>
      <GuessHistory guesses={state.guesses} pendingGuess={pendingGuess} onRevealComplete={commitGuess} />
    </AppShell>
  );
}
