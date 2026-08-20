import type { Country } from "../data/country";
import { CountryReveal } from "../game/CountryReveal";
import { COLORS } from "../theme";
import { ShareScoreButton, type ShareScoreProps } from "../share/ShareScoreButton";

// How both modes end: an outcome badge, the country in full, and the share
// button, sat at the top of the main column above whatever the player did
// to get there.
//
// The outcome is said once, here. The reveal below already names the
// country, so a second line elsewhere saying it again is pure repetition.
export function GameOverPanel({
  won,
  guessCount,
  country,
  gameLabel,
  share,
}: {
  won: boolean;
  guessCount: number;
  country: Country;
  gameLabel: string;
  share: Omit<ShareScoreProps, "gameLabel">;
}) {
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
      <div style={{ marginTop: 12 }}>
        <ShareScoreButton gameLabel={gameLabel} {...share} />
      </div>
    </div>
  );
}
