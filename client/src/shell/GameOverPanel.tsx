import { useState } from "react";
import type { Country } from "../data/country";
import { CountryReveal } from "../game/CountryReveal";
import { NextPuzzleCountdown } from "./NextPuzzleCountdown";
import type { Stats } from "../stats";
import { StatsModal } from "./StatsModal";
import { COLORS, FONT_FAMILY } from "../theme";
import { ShareScoreButton, type ShareScoreProps } from "../share/ShareScoreButton";

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
} as const;

// How both modes end: an outcome badge, the country in full, and the share
// button, sat at the top of the main column above whatever the player did
// to get there.
//
// The outcome is said once, here. The reveal below already names the
// country, so a second line elsewhere saying it again is pure repetition.
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
}: {
  won: boolean;
  guessCount: number;
  country: Country;
  gameLabel: string;
  maxGuesses: number;
  daily: { day: number; puzzleNumber: number; stats: Stats } | null;
  share: Omit<ShareScoreProps, "gameLabel" | "puzzleNumber">;
}) {
  const [statsOpen, setStatsOpen] = useState(false);
  const guessesUsedLabel = `${guessCount} ${guessCount === 1 ? "guess" : "guesses"}`;

  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `2px solid ${COLORS.border}` }}>
      <div
        style={{
          border: `1px solid ${won ? COLORS.accent : COLORS.mutedBorder}`,
          color: won ? COLORS.accent : COLORS.mutedLabel,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.04em",
          padding: "6px 14px",
          width: "fit-content",
          marginBottom: 16,
        }}
      >
        {won ? `Solved in ${guessesUsedLabel}` : "Out of guesses"}
      </div>
      <CountryReveal country={country} />
      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <ShareScoreButton gameLabel={gameLabel} puzzleNumber={daily?.puzzleNumber} {...share} />
        {daily && (
          <button type="button" style={SECONDARY_BUTTON_STYLE} onClick={() => setStatsOpen(true)}>
            Statistics
          </button>
        )}
      </div>
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
