import { useState } from "react";
import type { Country } from "../data/country";
import { CountryReveal } from "../game/CountryReveal";
import { NextPuzzleCountdown } from "./NextPuzzleCountdown";
import type { Stats } from "../stats";
import { StatsModal } from "./StatsModal";
import { COLORS, FONT_FAMILY } from "../theme";
import { ShareScoreButton, type ShareScoreProps } from "../share/ShareScoreButton";
import { WinFireworks } from "./WinFireworks";

// Outlined rather than filled, so sharing stays the one thing the panel is
// obviously asking for and the record is there for whoever wants it.
const SECONDARY_BUTTON_STYLE = {
  fontFamily: FONT_FAMILY,
  fontWeight: 800,
  fontSize: 14,
  background: "transparent",
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  padding: "10px 20px",
  cursor: "pointer",
  whiteSpace: "nowrap",
} as const;

// The result row, which is one row where there's room and two where there
// isn't.
//
// Given the room, the buttons are worth only what they measure and the name
// — the headline — takes the rest. Run out of room and that reverses badly:
// on a phone, 125px of button against "Saint Vincent and the Grenadines"
// left the name 194px to wrap into four lines, while the buttons stacked
// into a ragged column beside it, two widths and two left edges, to squeeze
// it that far. Narrower still and the name was down to 103px.
//
// So once the row is too narrow to hold both, they stop competing: the name
// takes the full width and the buttons drop underneath and split it in
// half. Equal halves rather than their natural widths, because two buttons
// of different lengths sharing a line read as a leftover row — and half a
// phone is a considerably better thumb target than 109px of outlined text
// was.
//
// The query is on the row's own width rather than the viewport's, because
// the viewport is not the thing that runs out: at 767px the rail is still
// beside the main column, which leaves this row 363px to work in — narrower
// than it gets on most phones, where the rail has moved below. A viewport
// breakpoint would call that case desktop and crush the name.
//
// 520px is where the two stop fitting: ~240px of name, the 16px gap, and
// 244px of buttons at their natural widths.
const RESULT_STYLES = `
  .gameover-resultbox { container-type: inline-size; }
  .gameover-result { display: flex; align-items: center; gap: 16px; }
  .gameover-headline { display: flex; align-items: baseline; gap: 10px; flex: 1 1 auto; min-width: 0; }
  .gameover-actions { display: flex; gap: 10px; flex: 0 0 auto; justify-content: flex-end; }
  @container (max-width: 520px) {
    .gameover-result { flex-wrap: wrap; row-gap: 14px; }
    .gameover-headline, .gameover-actions { flex: 1 1 100%; }
    /* flex-basis 0 rather than auto, so the halves come out equal whatever
       the two labels happen to measure. */
    .gameover-actions > * { flex-grow: 1; flex-basis: 0; min-width: 0; min-height: 44px; }
  }
`;

// How both modes end: one result row — the answer, how it went, and what
// there is to do about it — over the country in full, sat at the top of
// the main column above whatever the player did to get there.
//
// The row is flush left and unboxed, so the country's name carries the
// result at heading size rather than a coloured banner carrying it for
// them. Green appears twice and nowhere else: the tick, and the guess
// count. The name and the buttons are the type and the chrome the rest of
// the app already uses, which is what keeps the row a headline rather than
// a second thing competing with the share button.
//
// The outcome is said once, here — the reveal below no longer names the
// country, since this row does.
//
// A win gets fireworks and a result that lands rather than appears, but
// only when `celebrate` says the player actually just won it — see
// useJustWon. Losing gets neither, and nor does reopening yesterday's win.
//
// `daily` is null for a practice game, which has no puzzle number to quote,
// no record to add to and no tomorrow to wait for. That's also what gates
// the Statistics button: a record only exists once a daily game is done, so
// finishing one is what reveals it.
export function GameOverPanel({
  won,
  guessCount,
  country,
  gameLabel,
  maxGuesses,
  daily,
  share,
  celebrate = false,
}: {
  won: boolean;
  guessCount: number;
  country: Country;
  gameLabel: string;
  maxGuesses: number;
  daily: { day: number; puzzleNumber: number; stats: Stats } | null;
  share: Omit<ShareScoreProps, "gameLabel" | "puzzleNumber">;
  celebrate?: boolean;
}) {
  const [statsOpen, setStatsOpen] = useState(false);
  const guessesUsedLabel = `${guessCount} ${guessCount === 1 ? "GUESS" : "GUESSES"}`;

  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `2px solid ${COLORS.border}` }}>
      {celebrate && <WinFireworks />}
      <style>{RESULT_STYLES}</style>
      {/* The box is here to be measured — it's what the row's container
          query asks about — and it sits inside the panel rather than around
          it so the containment it switches on can't become a containing
          block for the fireworks, which are fixed to the viewport.
          The name and the count stay on one line together whichever way the
          row lays out: a long name wraps inside itself rather than breaking
          the two apart. */}
      <div
        className="gameover-resultbox"
        style={{
          fontFamily: FONT_FAMILY,
          paddingBottom: 16,
          marginBottom: 20,
          borderBottom: `2px solid ${COLORS.border}`,
        }}
      >
        <div className="gameover-result">
          <div
            className="gameover-headline"
            style={{
              animation: celebrate ? "win-result-land 620ms cubic-bezier(0.2, 0.9, 0.25, 1) both" : undefined,
            }}
          >
            {won && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ alignSelf: "center", flex: "none" }}>
                <path
                  d="M20 6 9 17l-5-5"
                  stroke={COLORS.correctBg}
                  strokeWidth={3.5}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </svg>
            )}
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>{country.name}</span>
            {/* The count is the whole outcome on a win — "solved" is what the
                tick beside it already says. A loss has no count worth
                colouring, so it says what happened in the same slot, in the
                grey that means neither hit nor miss. */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.04em",
                color: won ? COLORS.correctText : COLORS.mutedLabel,
                whiteSpace: "nowrap",
              }}
            >
              {won ? guessesUsedLabel : "OUT OF GUESSES"}
            </span>
          </div>
          <div className="gameover-actions">
            <ShareScoreButton gameLabel={gameLabel} puzzleNumber={daily?.puzzleNumber} {...share} />
            {daily && (
              <button type="button" style={SECONDARY_BUTTON_STYLE} onClick={() => setStatsOpen(true)}>
                Statistics
              </button>
            )}
          </div>
        </div>
      </div>
      <CountryReveal country={country} />
      {daily && (
        <>
          <NextPuzzleCountdown day={daily.day} />
          <StatsModal
            opened={statsOpen}
            onClose={() => setStatsOpen(false)}
            gameLabel={gameLabel}
            stats={daily.stats}
            maxGuesses={maxGuesses}
            latest={{ won, guessCount }}
          />
        </>
      )}
    </div>
  );
}
