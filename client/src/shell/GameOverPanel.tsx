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
  // See the share button: the row stacks rather than squashes.
  flexShrink: 0,
  whiteSpace: "nowrap",
} as const;

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
      {/* The row never breaks in two: the buttons stay on the right and
          stack one above the other when a long country name leaves no room
          for them side by side. The buttons themselves don't shrink, so the
          column can give way only as far as its widest button and the name
          takes whatever is left — which makes stacking what happens first,
          and the name wrapping the last resort on a phone.
          The name and the count sit centred against that column, whether
          it's one button tall or two, and stay on one line together: a long
          name wraps inside itself rather than breaking the three apart. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontFamily: FONT_FAMILY,
          paddingBottom: 16,
          marginBottom: 20,
          borderBottom: `2px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            flex: "1 1 auto",
            minWidth: 0,
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
        <div style={{ display: "flex", gap: 10, flex: "0 1 auto", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <ShareScoreButton gameLabel={gameLabel} puzzleNumber={daily?.puzzleNumber} {...share} />
          {daily && (
            <button type="button" style={SECONDARY_BUTTON_STYLE} onClick={() => setStatsOpen(true)}>
              Statistics
            </button>
          )}
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
