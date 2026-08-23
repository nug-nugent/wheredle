import type { Stats } from "../stats";
import { COLORS, FONT_FAMILY } from "../theme";

interface Row {
  key: string;
  label: string;
  count: number;
  won: boolean;
}

// One row per winning guess count, then one for games lost.
//
// Losses are derived rather than recorded — they're what's left of `played`
// once the wins are taken out — but they belong on the chart: without them
// the bars only account for the games that were won, and a record of 20
// played would draw as 12.
//
// Anything recorded past the current limit folds into the last row instead of
// vanishing. That only happens if a mode's guess limit is ever lowered, and a
// game genuinely won is better shown slightly wrong than not at all.
function buildRows(stats: Stats, maxGuesses: number): Row[] {
  const wins = new Array<number>(maxGuesses).fill(0);
  stats.distribution.forEach((count, index) => {
    wins[Math.min(index, maxGuesses - 1)] += count;
  });

  return [
    ...wins.map((count, i) => ({ key: String(i + 1), label: String(i + 1), count, won: true })),
    { key: "lost", label: "X", count: Math.max(0, stats.played - stats.wins), won: false },
  ];
}

// How many guesses games have taken, as a bar per outcome.
//
// Shown from the very first game rather than waiting for a sample worth
// calling a distribution: at three games one full-width bar does overstate
// how settled a player's form is, but the count sits beside every bar, so
// what's actually being claimed is legible — "2 games", not "a peak". Hiding
// it until some threshold would trade that for a panel that's mysteriously
// empty, and a state that appears once and is never seen again.
//
// `latest` marks the game just finished, which is what makes the chart read
// as a result rather than a table.
export function GuessDistribution({
  stats,
  maxGuesses,
  latest,
}: {
  stats: Stats;
  maxGuesses: number;
  latest: { won: boolean; guessCount: number } | null;
}) {
  const rows = buildRows(stats, maxGuesses);
  // Never zero, so an empty record draws flat rather than dividing by nothing.
  const peak = Math.max(1, ...rows.map((row) => row.count));

  const highlighted = latest === null ? null : latest.won ? String(Math.min(latest.guessCount, maxGuesses)) : "lost";

  return (
    <div style={{ fontFamily: FONT_FAMILY, marginTop: 20 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: COLORS.textDimmed }}>
        Guesses taken
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
        {rows.map((row) => {
          const active = row.key === highlighted;
          const fill = active ? (row.won ? COLORS.correctBg : COLORS.wrongBg) : COLORS.borderFaint;

          return (
            <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 14,
                  fontSize: 12,
                  fontWeight: 800,
                  textAlign: "right",
                  color: row.won ? COLORS.text : COLORS.mutedLabel,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.label}
              </div>
              {/* A zero draws nothing at all rather than a stub, so an empty
                  row can't be mistaken for a game that was played. */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ width: `${(row.count / peak) * 100}%`, height: 18, background: fill }} />
              </div>
              <div
                style={{
                  width: 20,
                  fontSize: 12,
                  fontWeight: row.count > 0 ? 800 : 400,
                  textAlign: "right",
                  color: row.count > 0 ? COLORS.text : COLORS.textFaint,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
