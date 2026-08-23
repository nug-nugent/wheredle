import { OTHER_GAMES } from "../data/games";
import { COLORS } from "../theme";
import { CoffeeAsk } from "./CoffeeAsk";
import { ExternalLink, Prose } from "./InfoModal";

// The other things I've built, as bordered rows rather than cards — same
// flat, square language as the knowledge rail, and a list this short would
// look padded dressed up as anything grander.
export function MoreGamesPanel() {
  return (
    <>
      <Prose>Other things of mine, if this one is your sort of thing.</Prose>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
        {OTHER_GAMES.map((game) => (
          <ExternalLink key={game.url} href={game.url} as="row">
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 800, fontSize: 15, color: COLORS.text }}>{game.name}</span>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: COLORS.textDimmed,
                  marginTop: 2,
                }}
              >
                {game.blurb}
              </span>
            </span>
            {/* The row is the link, so the arrow marks it as one rather than
                being a second thing to aim at. */}
            <svg
              width="9"
              height="14"
              viewBox="0 0 9 14"
              fill="none"
              stroke={COLORS.accent}
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
              style={{ marginLeft: "auto", flex: "none" }}
            >
              <path d="M1.5 1 7.5 7l-6 6" />
            </svg>
          </ExternalLink>
        ))}
      </div>
      <CoffeeAsk />
    </>
  );
}
