import { GlobeLogo } from "./GlobeLogo";
import { ChoicePrompt } from "./game/ChoicePrompt";
import { CountryReveal } from "./game/CountryReveal";
import { MAX_GUESSES } from "./game/engine";
import { GuessInput } from "./game/GuessInput";
import { HintPanel } from "./game/HintPanel";
import { buildWheredleShare } from "./game/share";
import { useGame } from "./game/useGame";
import { ShareScoreButton } from "./share/ShareScoreButton";
import { COLORS, FONT_FAMILY } from "./theme";

export default function App() {
  const { state, guess, chooseHint, newGame, choiceOptions } = useGame();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.page,
        color: COLORS.text,
        fontFamily: FONT_FAMILY,
        padding: "48px 24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <GlobeLogo size={32} />
          <div style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.02em" }}>WHEREDLE</div>
        </div>

        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {state.status === "playing" && <HintPanel hints={state.hints} target={state.target} />}

          {state.status === "playing" && choiceOptions && (
            <ChoicePrompt options={choiceOptions} onChoose={chooseHint} />
          )}

          {state.status === "playing" && !choiceOptions && (
            <GuessInput
              onGuess={guess}
              guessedNames={new Set(state.guesses.map((g) => g.country.name))}
            />
          )}

          {state.status !== "playing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span
                style={{
                  border: `1px solid ${state.status === "won" ? COLORS.accent : COLORS.mutedBorder}`,
                  color: state.status === "won" ? COLORS.accent : COLORS.mutedLabel,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  padding: "6px 14px",
                  width: "fit-content",
                }}
              >
                {state.status === "won" ? "Correct!" : "Out of guesses"}
              </span>
              <CountryReveal country={state.target} />
              <ShareScoreButton gameLabel="Wheredle" {...buildWheredleShare(state)} />
            </div>
          )}

          {state.guesses.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: COLORS.textDimmed,
                }}
              >
                Guesses ({state.guesses.length}/{MAX_GUESSES})
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {state.guesses.map((g, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      background: g.correct ? COLORS.correctBg : COLORS.wrongBg,
                      color: g.correct ? COLORS.correctValue : COLORS.wrongValue,
                    }}
                  >
                    {g.country.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={newGame}
            style={{
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 13,
              border: `1px solid ${COLORS.border}`,
              background: "transparent",
              color: COLORS.text,
              padding: "9px 16px",
              cursor: "pointer",
              width: "fit-content",
            }}
          >
            New game
          </button>
        </div>
      </div>
    </div>
  );
}
