import { useEffect, useRef, useState } from "react";
import { CountryReveal } from "../game/CountryReveal";
import { GuessInput } from "../game/GuessInput";
import { NavMenu } from "../nav/NavMenu";
import { ShareScoreButton } from "../share/ShareScoreButton";
import { COLORS, countdownTint, FONT_FAMILY } from "../theme";
import { getKnownFacts } from "./categories";
import { MAX_GUESSES } from "./engine";
import { GuessHistory } from "./GuessHistory";
import { KnownFacts } from "./KnownFacts";
import { buildAlexShare } from "./share";
import { useAlexGame } from "./useAlexGame";

// Scoped to `.alex-root` so none of this leaks into classic Wheredle.
const ALEX_STYLES = `
  /* The page itself never scrolls: the shell is exactly one viewport tall
     (dvh so a phone's collapsing URL bar doesn't crop it), the nav,
     toolbar and knowledge strip hold their height, and the guess history
     in the middle takes whatever is left and scrolls inside it. */
  .alex-root { height: 100vh; height: 100dvh; overflow: hidden; }
  .alex-fixed-row { flex: none; }
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
  /* The strip's heading doubles as its disclosure control, so the whole
     width of it is the tap target rather than just the chevron. */
  .alex-strip-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 0 0 8px;
    border: none;
    background: transparent;
    color: ${COLORS.textDimmed};
    font-family: inherit;
    cursor: pointer;
  }
  .alex-rail { display: flex; }
  .alex-strip { display: none; }
  @media (max-width: 767px) {
    .alex-rail { display: none; }
    .alex-strip { display: block; }
    /* Pinned open, the strip claims a third of the viewport from the bottom
       up. The shell above it is flex, so the guess history gives up the space
       and scrolls in what's left; the facts scroll inside the strip rather
       than the page, which never scrolls. */
    .alex-strip-tall {
      display: flex;
      flex-direction: column;
      height: calc(100vh / 3);
      height: calc(100dvh / 3);
    }
    .alex-strip-tall .alex-strip-body { flex: 1; min-height: 0; overflow-y: auto; }
    /* Title, guess count and menu stay on one row at phone widths — the
       nav never wraps, it just tightens. */
    .alex-nav { padding: 12px 16px; gap: 10px; }
    .alex-nav-title { font-size: 20px; }
    .alex-nav-right { gap: 10px; }
    /* Narrower gutters buy the guess field enough width to keep its
       button alongside it rather than on a second row. */
    .alex-toolbar { padding: 12px 16px; gap: 12px; }
    .alex-history { padding: 16px; }
    /* The nav's guesses-remaining chip is a few pixels away and says the
       same thing; on desktop the heading still earns its place labelling
       this column against the rail's "What you know". */
    .alex-history-heading { display: none; }
  }
  .alex-root ::selection { background: rgba(236,48,19,0.3); }
  .alex-root a { color: ${COLORS.accent}; }
  .alex-root a:hover { color: ${COLORS.accentHover}; }
  .alex-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .alex-root ::-webkit-scrollbar-thumb { background: ${COLORS.borderFaint}; }
`;

export default function AlexApp() {
  const { state, pendingGuess, guess, commitGuess, newGame } = useAlexGame();
  // Players track "how much rope have I got left", not "which guess is this",
  // so the chip counts down rather than reporting a position in a sequence.
  const guessesRemaining = Math.max(MAX_GUESSES - state.guesses.length, 0);
  const lastGuess = guessesRemaining === 1;
  // At one left there is nothing useful to count, so the chip names the
  // moment instead of measuring it.
  const remainingLabel = lastGuess ? "final guess" : `${guessesRemaining} guesses remaining`;
  // The chip's colour is the countdown said a second way: green while the
  // rope is long, red once it has run out, so a glance registers the state
  // before the words are read. The final guess also goes bold, since that is
  // the one step where the count changes what a player should do.
  const urgency = (MAX_GUESSES - guessesRemaining) / (MAX_GUESSES - 1);
  const remainingColour = countdownTint(urgency);
  const guessesUsedLabel = `${state.guesses.length} ${state.guesses.length === 1 ? "guess" : "guesses"}`;
  const knownFacts = getKnownFacts(state.guesses);
  const inputDisabled = state.status !== "playing" || !!pendingGuess;
  const finished = state.status === "won" || state.status === "lost";
  const historyRef = useRef<HTMLDivElement>(null);
  // Deliberately not persisted: pinning the strip open is a per-moment "let
  // me see the lot" gesture rather than a setting, and the game state itself
  // only lives for the session anyway.
  const [knowledgePinned, setKnowledgePinned] = useState(false);

  // The reveal is prepended to a pane the player has usually scrolled down
  // by the last guess, so send them back to the top to meet it.
  useEffect(() => {
    if (finished) historyRef.current?.scrollTo({ top: 0 });
  }, [finished]);

  return (
    <div
      className="alex-root"
      style={{
        display: "flex",
        flexDirection: "column",
        background: COLORS.surface,
        color: COLORS.text,
        fontFamily: FONT_FAMILY,
      }}
    >
      <style>{ALEX_STYLES}</style>

      {/* nav */}
      <div className="alex-nav alex-fixed-row">
        <div className="alex-nav-title">WHEREDLE</div>
        <div className="alex-nav-right">
          {/* A countdown has nothing to say once the game is over — the
              reveal below carries the outcome instead. */}
          {!finished && (
            <div
              style={{
                border: `1px solid ${remainingColour}`,
                color: remainingColour,
                fontSize: 11,
                fontWeight: lastGuess ? 800 : 400,
                letterSpacing: "0.04em",
                padding: "5px 12px",
                whiteSpace: "nowrap",
              }}
            >
              {remainingLabel.toUpperCase()}
            </div>
          )}
          <NavMenu onNewGame={newGame} />
        </div>
      </div>

      {/* toolbar — gone once the game is over rather than left sitting there
          disabled, since a dead control still costs a phone a whole row */}
      {!finished && (
        <div className="alex-toolbar alex-fixed-row">
          <GuessInput
            onGuess={guess}
            guessedNames={new Set(state.guesses.map((g) => g.country.name))}
            disabled={inputDisabled}
          />
        </div>
      )}

      {/* body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div ref={historyRef} className="alex-history" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {/* The reveal scrolls with the guesses rather than sitting in fixed
              chrome: it's tall enough (flag, facts, share button) to leave a
              phone with barely a sliver of history underneath it. */}
          {finished && (
            <div
              style={{
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: `2px solid ${COLORS.border}`,
              }}
            >
              {/* The outcome is said once, here. The reveal below already
                  names the country, so the old toolbar line saying it again
                  a few pixels away was pure repetition. */}
              <div
                style={{
                  border: `1px solid ${state.status === "won" ? COLORS.accent : COLORS.mutedBorder}`,
                  color: state.status === "won" ? COLORS.accent : COLORS.mutedLabel,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  padding: "6px 14px",
                  width: "fit-content",
                  marginBottom: 16,
                }}
              >
                {state.status === "won" ? `Solved in ${guessesUsedLabel}` : "Out of guesses"}
              </div>
              <CountryReveal country={state.target} />
              <div style={{ marginTop: 12 }}>
                <ShareScoreButton gameLabel="Wheredle: Alex Mode" {...buildAlexShare(state)} />
              </div>
            </div>
          )}
          <div
            className="alex-history-heading"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: COLORS.textDimmed,
              marginBottom: 10,
            }}
          >
            Guesses ({state.guesses.length})
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

      {/* mobile knowledge strip — one scrolling row by default; pinned, it
          takes a third of the screen and the facts wrap into a grid, so a
          player with a lot known can read more of it without swiping */}
      <div
        className={`alex-strip alex-fixed-row${knowledgePinned ? " alex-strip-tall" : ""}`}
        style={{
          borderTop: `2px solid ${COLORS.border}`,
          background: COLORS.surface,
          boxShadow: "0 -6px 16px rgba(45,43,43,0.12)",
          padding: "10px 16px 14px",
        }}
      >
        <button
          type="button"
          className="alex-strip-toggle alex-fixed-row"
          onClick={() => setKnowledgePinned((pinned) => !pinned)}
          aria-expanded={knowledgePinned}
          aria-controls="alex-knowledge"
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            What you know
          </span>
          <svg
            width="14"
            height="9"
            viewBox="0 0 14 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            focusable="false"
            style={{ transform: knowledgePinned ? "rotate(180deg)" : undefined, transition: "transform 120ms ease" }}
          >
            <path d="M1 7.5 7 1.5l6 6" />
          </svg>
        </button>
        <div id="alex-knowledge" className="alex-strip-body">
          <KnownFacts facts={knownFacts} direction={knowledgePinned ? "grid" : "row"} />
        </div>
      </div>
    </div>
  );
}
