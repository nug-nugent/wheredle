import { useEffect, useRef } from "react";
import { AppShell, MainHeading } from "../shell/AppShell";
import { GameOverPanel } from "../shell/GameOverPanel";
import { GuessCountdown } from "../shell/GuessCountdown";
import { PracticeChip } from "../shell/PracticeChip";
import { puzzleNumber } from "../daily";
import { GuessInput } from "../game/GuessInput";
import { getKnownFacts } from "./categories";
import { categoriesFromKeys } from "./dailyBoard";
import { MAX_GUESSES } from "./engine";
import { GuessHistory } from "./GuessHistory";
import { KnownFacts } from "./KnownFacts";
import { buildAlexShare } from "./share";
import { useAlexGame } from "./useAlexGame";

export default function AlexApp() {
  const { state, day, stats, isPractice, pendingGuess, guess, commitGuess, newPractice, exitPractice } = useAlexGame();
  // The board this game was dealt, read back from the game itself rather than
  // redrawn, so it can't shift under a game in progress.
  const categories = categoriesFromKeys(state.categoryKeys);
  const knownFacts = getKnownFacts(categories, state.guesses);
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
      puzzleNumber={isPractice ? undefined : puzzleNumber(day)}
      onNewPractice={newPractice}
      onExitPractice={isPractice ? exitPractice : undefined}
      mainRef={historyRef}
      // A countdown has nothing to say once the game is over — the reveal
      // below carries the outcome instead. Which game you're in still does.
      status={
        <>
          {isPractice && <PracticeChip />}
          {!finished && <GuessCountdown used={state.guesses.length} max={MAX_GUESSES} />}
        </>
      }
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
          gameLabel={isPractice ? "Wheredle: Alex Mode (practice)" : "Wheredle: Alex Mode"}
          daily={isPractice ? null : { puzzleNumber: puzzleNumber(day), stats }}
          share={buildAlexShare(state, categories)}
        />
      )}
      <MainHeading>Guesses ({state.guesses.length})</MainHeading>
      <GuessHistory
        guesses={state.guesses}
        categories={categories}
        pendingGuess={pendingGuess}
        onRevealComplete={commitGuess}
      />
    </AppShell>
  );
}
