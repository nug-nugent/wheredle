import { CountryReveal } from "../game/CountryReveal";
import { GuessInput } from "../game/GuessInput";
import { ShareScoreButton } from "../share/ShareScoreButton";
import { COLORS, FONT_FAMILY } from "../theme";
import { getKnownFacts } from "./categories";
import { MAX_GUESSES } from "./engine";
import { GuessHistory } from "./GuessHistory";
import { KnownFacts } from "./KnownFacts";
import { buildAlexShare } from "./share";
import { useAlexGame } from "./useAlexGame";

// Scoped to `.alex-root` so none of this leaks into classic Wheredle.
const ALEX_STYLES = `
  .alex-rail { display: flex; }
  .alex-strip { display: none; }
  @media (max-width: 767px) {
    .alex-rail { display: none; }
    .alex-strip { display: block; }
  }
  .alex-root ::selection { background: rgba(236,48,19,0.3); }
  .alex-root a { color: ${COLORS.accent}; }
  .alex-root a:hover { color: ${COLORS.accentHover}; }
  .alex-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .alex-root ::-webkit-scrollbar-thumb { background: ${COLORS.borderFaint}; }
`;

export default function AlexApp() {
  const { state, pendingGuess, guess, commitGuess, newGame } = useAlexGame();
  const guessCountLabel = `${state.guesses.length}/${MAX_GUESSES}`;
  const knownFacts = getKnownFacts(state.guesses);
  const inputDisabled = state.status !== "playing" || !!pendingGuess;
  const finished = state.status === "won" || state.status === "lost";

  return (
    <div
      className="alex-root"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: COLORS.surface,
        color: COLORS.text,
        fontFamily: FONT_FAMILY,
      }}
    >
      <style>{ALEX_STYLES}</style>

      {/* nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 28px",
          borderBottom: `2px solid ${COLORS.border}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>WHEREDLE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
          <div
            style={{
              border: `1px solid ${COLORS.accent}`,
              color: COLORS.accent,
              fontSize: 11,
              letterSpacing: "0.04em",
              padding: "5px 12px",
            }}
          >
            GUESS {guessCountLabel}
          </div>
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
            }}
          >
            New game
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 28px",
          borderBottom: `2px solid ${COLORS.border}`,
          flexWrap: "wrap",
        }}
      >
        <GuessInput
          onGuess={guess}
          guessedNames={new Set(state.guesses.map((g) => g.country.name))}
          disabled={inputDisabled}
        />
        {state.status === "won" && (
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.accent }}>
            Solved in {guessCountLabel} — the country was {state.target.name}.
          </div>
        )}
        {state.status === "lost" && (
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.accentHover }}>
            Out of guesses — it was {state.target.name}.
          </div>
        )}
      </div>

      {finished && (
        <div style={{ padding: "20px 28px", borderBottom: `2px solid ${COLORS.border}` }}>
          <CountryReveal country={state.target} />
          <div style={{ marginTop: 12 }}>
            <ShareScoreButton gameLabel="Wheredle: Alex Mode" {...buildAlexShare(state)} />
          </div>
        </div>
      )}

      {/* body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: COLORS.textDimmed,
              marginBottom: 14,
            }}
          >
            Guesses ({guessCountLabel})
          </div>
          <GuessHistory guesses={state.guesses} pendingGuess={pendingGuess} onRevealComplete={commitGuess} />
        </div>

        <div
          className="alex-rail"
          style={{
            width: 340,
            flex: "none",
            flexDirection: "column",
            borderLeft: `2px solid ${COLORS.border}`,
            overflowY: "auto",
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: COLORS.textDimmed,
              marginBottom: 6,
            }}
          >
            What you know
          </div>
          <KnownFacts facts={knownFacts} direction="column" />
        </div>
      </div>

      {/* mobile knowledge strip */}
      <div
        className="alex-strip"
        style={{
          borderTop: `2px solid ${COLORS.border}`,
          background: COLORS.surface,
          boxShadow: "0 -6px 16px rgba(45,43,43,0.12)",
          padding: "10px 16px 14px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: COLORS.textDimmed,
            marginBottom: 8,
          }}
        >
          What you know
        </div>
        <KnownFacts facts={knownFacts} direction="row" />
      </div>
    </div>
  );
}
