import { useState, type ReactNode, type RefObject } from "react";
import { GlobeLogo } from "../GlobeLogo";
import { NavMenu } from "../nav/NavMenu";
import { COLORS, FONT_FAMILY } from "../theme";

// The frame both game modes are built in, so the two read as one product
// rather than as two sketches of one: a nav holding the wordmark, a status
// chip and the menu; one row for whatever the player acts on next; then a
// scrolling main column with a rail of standing knowledge beside it.
//
// The page itself never scrolls: the shell is exactly one viewport tall
// (dvh so a phone's collapsing URL bar doesn't crop it), the nav, toolbar
// and rail strip hold their height, and the main column in the middle takes
// whatever is left and scrolls inside it.
const SHELL_STYLES = `
  .shell-root { height: 100vh; height: 100dvh; overflow: hidden; }
  .shell-fixed-row { flex: none; }
  .shell-nav {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 28px;
    border-bottom: 2px solid ${COLORS.border};
  }
  .shell-nav-title { font-weight: 800; font-size: 22px; letter-spacing: -0.02em; }
  /* The edition line, sat under the wordmark like an issue number. Quiet
     enough that the wordmark still reads as the title, present enough that a
     player can quote it when comparing scores. */
  .shell-nav-number { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; line-height: 1; }
  .shell-nav-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
  .shell-toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 28px;
    border-bottom: 2px solid ${COLORS.border};
    flex-wrap: wrap;
  }
  .shell-main { padding: 24px 28px; }
  /* The strip's heading doubles as its disclosure control, so the whole
     width of it is the tap target rather than just the chevron. */
  .shell-strip-toggle {
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
  .shell-rail { display: flex; }
  .shell-strip { display: none; }
  @media (max-width: 767px) {
    .shell-rail { display: none; }
    .shell-strip { display: block; }
    /* Pinned open, the strip claims a third of the viewport from the bottom
       up. The shell above it is flex, so the main column gives up the space
       and scrolls in what is left; the rail scrolls inside the strip rather
       than the page, which never scrolls. */
    .shell-strip-tall {
      display: flex;
      flex-direction: column;
      height: calc(100vh / 3);
      height: calc(100dvh / 3);
    }
    .shell-strip-tall .shell-strip-body { flex: 1; min-height: 0; overflow-y: auto; }
    /* Title, status chip and menu stay on one row at phone widths — the
       nav never wraps, it just tightens. */
    .shell-nav { padding: 12px 16px; gap: 10px; }
    .shell-nav-title { font-size: 20px; }
    .shell-nav-right { gap: 10px; }
    /* Narrower gutters buy the guess field enough width to keep its
       button alongside it rather than on a second row. */
    .shell-toolbar { padding: 12px 16px; gap: 12px; }
    .shell-main { padding: 16px; }
    /* On desktop the heading earns its place labelling this column against
       the rail's own; on a phone the rail is a strip below rather than a
       column beside, so there is nothing left to tell it apart from — and
       every entry in the column carries its own label anyway. */
    .shell-main-heading { display: none; }
  }
  .shell-root ::selection { background: rgba(236,48,19,0.3); }
  .shell-root a { color: ${COLORS.accent}; }
  .shell-root a:hover { color: ${COLORS.accentHover}; }
  .shell-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .shell-root ::-webkit-scrollbar-thumb { background: ${COLORS.borderFaint}; }
`;

const HEADING_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: COLORS.textDimmed,
} as const;

export interface ShellRail {
  /** Names the column on desktop and the strip's disclosure on mobile. */
  heading: string;
  /**
   * Renders the same list three ways: a vertical rail on desktop, a
   * horizontal scrolling strip on mobile, and a wrapping grid when that
   * strip is pinned open to a third of the screen.
   */
  render: (layout: "column" | "row" | "grid") => ReactNode;
}

/** Labels the main column. Hidden on phones — see .shell-main-heading. */
export function MainHeading({ children }: { children: ReactNode }) {
  return (
    <div className="shell-main-heading" style={{ ...HEADING_STYLE, marginBottom: 10 }}>
      {children}
    </div>
  );
}

export function AppShell({
  status,
  puzzleNumber,
  onNewPractice,
  onExitPractice,
  toolbar,
  mainRef,
  rail,
  children,
}: {
  /** The nav's right-hand chip — a countdown while there is a game to play. */
  status?: ReactNode;
  /** Which day's puzzle this is. Omitted for practice games, which are no day's. */
  puzzleNumber?: number;
  onNewPractice: () => void;
  /** Passed only while a practice game is on screen. */
  onExitPractice?: () => void;
  /**
   * The one row a player acts in. Pass nothing once the game is over rather
   * than a disabled control, since a dead one still costs a phone a row.
   */
  toolbar?: ReactNode;
  /** For scrolling the main column back to the top when a game ends. */
  mainRef?: RefObject<HTMLDivElement | null>;
  rail?: ShellRail;
  children: ReactNode;
}) {
  // Deliberately not persisted: pinning the strip open is a per-moment "let
  // me see the lot" gesture rather than a setting, and the game state itself
  // only lives for the session anyway.
  const [railPinned, setRailPinned] = useState(false);

  return (
    <div
      className="shell-root"
      style={{
        display: "flex",
        flexDirection: "column",
        background: COLORS.surface,
        color: COLORS.text,
        fontFamily: FONT_FAMILY,
      }}
    >
      <style>{SHELL_STYLES}</style>

      {/* nav */}
      <div className="shell-nav shell-fixed-row">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GlobeLogo size={26} />
          <div>
            <div className="shell-nav-title">WHEREDLE</div>
            {puzzleNumber !== undefined && (
              <div className="shell-nav-number" style={{ color: COLORS.textDimmed }}>
                NO. {puzzleNumber}
              </div>
            )}
          </div>
        </div>
        <div className="shell-nav-right">
          {status}
          <NavMenu onNewPractice={onNewPractice} onExitPractice={onExitPractice} />
        </div>
      </div>

      {toolbar && <div className="shell-toolbar shell-fixed-row">{toolbar}</div>}

      {/* body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div ref={mainRef} className="shell-main" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
          {children}
        </div>

        {rail && (
          <div
            className="shell-rail"
            style={{
              width: 340,
              flex: "none",
              flexDirection: "column",
              borderLeft: `2px solid ${COLORS.border}`,
              overflowY: "auto",
              padding: 24,
            }}
          >
            <div style={{ ...HEADING_STYLE, marginBottom: 6 }}>{rail.heading}</div>
            {rail.render("column")}
          </div>
        )}
      </div>

      {/* mobile rail strip — one scrolling row by default; pinned, it takes
          a third of the screen and the cards wrap into a grid, so a player
          with a lot to keep track of can read more without swiping */}
      {rail && (
        <div
          className={`shell-strip shell-fixed-row${railPinned ? " shell-strip-tall" : ""}`}
          style={{
            borderTop: `2px solid ${COLORS.border}`,
            background: COLORS.surface,
            boxShadow: "0 -6px 16px rgba(45,43,43,0.12)",
            padding: "10px 16px 14px",
          }}
        >
          <button
            type="button"
            className="shell-strip-toggle shell-fixed-row"
            onClick={() => setRailPinned((pinned) => !pinned)}
            aria-expanded={railPinned}
            aria-controls="shell-rail-strip"
          >
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {rail.heading}
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
              style={{ transform: railPinned ? "rotate(180deg)" : undefined, transition: "transform 120ms ease" }}
            >
              <path d="M1 7.5 7 1.5l6 6" />
            </svg>
          </button>
          <div id="shell-rail-strip" className="shell-strip-body">
            {rail.render(railPinned ? "grid" : "row")}
          </div>
        </div>
      )}
    </div>
  );
}
