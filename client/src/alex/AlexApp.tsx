import { CountryReveal } from "../game/CountryReveal";
import { GuessInput } from "../game/GuessInput";
import { NavMenu } from "../nav/NavMenu";
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
  .alex-nav {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 28px;
    border-bottom: 2px solid ${COLORS.border};
  }
  .alex-nav-title { font-weight: 800; font-size: 22px; letter-spacing: -0.02em; }
  .alex-nav-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
  .alex-toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 28px;
    border-bottom: 2px solid ${COLORS.border};
    flex-wrap: wrap;
  }
  .alex-history { padding: 24px 28px; }
  .alex-rail { display: flex; }
  .alex-strip { display: none; }
  @media (max-width: 767px) {
    .alex-rail { display: none; }
    .alex-strip { display: block; }
    /* Title, guess count and menu stay on one row at phone widths — the
       nav never wraps, it just tightens. */
    .alex-nav { padding: 12px 16px; gap: 10px; }
    .alex-nav-title { font-size: 20px; }
    .alex-nav-right { gap: 10px; }
    /* Narrower gutters buy the guess field enough width to keep its
       button alongside it rather than on a second row. */
    .alex-toolbar { padding: 12px 16px; gap: 12px; }
    .alex-history { padding: 16px; }
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
      <div className="alex-nav">
        <div className="alex-nav-title">WHEREDLE</div>
        <div className="alex-nav-right">
          <div
            style={{
              border: `1px solid ${COLORS.accent}`,
              color: COLORS.accent,
              fontSize: 11,
              letterSpacing: "0.04em",
              padding: "5px 12px",
              whiteSpace: "nowrap",
            }}
          >
            GUESS {guessCountLabel}
          </div>
          <NavMenu onNewGame={newGame} />
        </div>
      </div>

      {/* toolbar */}
      <div className="alex-toolbar">
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
        <div className="alex-history" style={{ flex: 1, overflowY: "auto" }}>
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
