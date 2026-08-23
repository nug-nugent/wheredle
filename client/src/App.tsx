import { useEffect, useRef } from "react";
import { ChoicePrompt } from "./game/ChoicePrompt";
import { MAX_GUESSES } from "./game/engine";
import { GuessInput } from "./game/GuessInput";
import { GuessRail } from "./game/GuessRail";
import { HintPanel } from "./game/HintPanel";
import { buildWheredleShare } from "./game/share";
import { puzzleNumber } from "./daily";
import { useGame } from "./game/useGame";
import { AppShell, MainHeading } from "./shell/AppShell";
import { GameOverPanel } from "./shell/GameOverPanel";
import { GuessCountdown } from "./shell/GuessCountdown";
import { PracticeChip } from "./shell/PracticeChip";

export default function App() {
  const { state, day, stats, isPractice, guess, chooseHint, newPractice, exitPractice, choiceOptions } = useGame();
  const finished = state.status !== "playing";
  const cluesRef = useRef<HTMLDivElement>(null);

  // The reveal is prepended to a column the player has usually scrolled
  // down by the last clue, so send them back to the top to meet it.
  useEffect(() => {
    if (finished) cluesRef.current?.scrollTo({ top: 0 });
  }, [finished]);

  return (
    <AppShell
      onNewPractice={newPractice}
      onExitPractice={isPractice ? exitPractice : undefined}
      mainRef={cluesRef}
      // A countdown has nothing to say once the game is over — the reveal
      // below carries the outcome instead. Which game you're in still does.
      status={
        <>
          {isPractice && <PracticeChip />}
          {!finished && <GuessCountdown used={state.guesses.length} max={MAX_GUESSES} />}
        </>
      }
      // The toolbar is the one row the player acts in, and the game asks for
      // exactly one thing at a time: pick the next clue, or guess. Choosing
      // blocks guessing in the engine, so the two never need to share it.
      toolbar={
        !finished &&
        (choiceOptions ? (
          <ChoicePrompt options={choiceOptions} onChoose={chooseHint} />
        ) : (
          <GuessInput onGuess={guess} guessedNames={new Set(state.guesses.map((g) => g.country.name))} />
        ))
      }
      rail={{
        heading: "Your guesses",
        render: (layout) => <GuessRail guesses={state.guesses} layout={layout} />,
      }}
    >
      {finished && (
        <GameOverPanel
          won={state.status === "won"}
          guessCount={state.guesses.length}
          country={state.target}
          gameLabel={isPractice ? "Wheredle (practice)" : "Wheredle"}
          daily={isPractice ? null : { puzzleNumber: puzzleNumber(day), stats }}
          share={buildWheredleShare(state)}
        />
      )}
      <MainHeading>Clues ({state.hints.length})</MainHeading>
      <HintPanel hints={state.hints} target={state.target} />
    </AppShell>
  );
}
