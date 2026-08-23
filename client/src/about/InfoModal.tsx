import type { CSSProperties, ReactNode } from "react";
import { Modal } from "@mantine/core";
import { COLORS, FONT_FAMILY } from "../theme";

// The modal is portalled out of the shell, so the shell's own link colours
// (see AppShell) don't reach it — these panels carry their own. The buttons
// live here rather than in an inline style so that they can have a hover
// state, which is also why the panels reach for a class name and not a style
// object the way most of the app does.
const PANEL_STYLES = `
  .info-panel a { color: ${COLORS.accent}; }
  .info-panel a:hover { color: ${COLORS.accentHover}; }
  /* Outlined rather than filled: the solid accent belongs to the share
     button, which is the one thing the game actually asks a player to do. */
  .info-panel .info-button {
    display: inline-block;
    font-family: ${FONT_FAMILY};
    font-weight: 800;
    font-size: 14px;
    background: transparent;
    color: ${COLORS.text};
    border: 1px solid ${COLORS.border};
    padding: 10px 20px;
    text-decoration: none;
  }
  .info-panel .info-button:hover { color: ${COLORS.accent}; border-color: ${COLORS.accent}; }
  /* A whole row that happens to be a link — the border is the anchor's own,
     so the hover lands on the frame rather than on the words inside it. */
  .info-panel .info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid ${COLORS.border};
    padding: 12px 14px;
    text-decoration: none;
  }
  .info-panel .info-row:hover { border-color: ${COLORS.accent}; }
`;

// The frame the menu's three text panels — how to play, more games, about —
// are all poured into. Same chrome as the statistics modal, since a player
// opening either one is doing the same thing: stepping out of the game for a
// moment to read something, then going back to it.
export function InfoModal({
  opened,
  onClose,
  title,
  children,
}: {
  opened: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius={0}
      size="lg"
      title={title}
      styles={{
        content: { border: `1px solid ${COLORS.border}`, background: COLORS.surface },
        header: { background: COLORS.surface, fontFamily: FONT_FAMILY },
        title: { fontFamily: FONT_FAMILY, fontWeight: 800, fontSize: 16 },
        body: { fontFamily: FONT_FAMILY, paddingBottom: 24 },
      }}
    >
      <style>{PANEL_STYLES}</style>
      <div className="info-panel">{children}</div>
    </Modal>
  );
}

// Reading copy, which wants a looser line than the game's own labels: these
// panels are the only paragraphs in the product.
const PROSE_STYLE: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.55,
  color: COLORS.text,
  margin: "0 0 10px",
};

export function Prose({ children }: { children: ReactNode }) {
  return <p style={PROSE_STYLE}>{children}</p>;
}

/** A run of prose under its own small caps heading, in the rail's voice. */
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: COLORS.textDimmed,
          marginBottom: 8,
        }}
      >
        {heading}
      </div>
      {children}
    </div>
  );
}

// Anything leaving the site opens in a new tab: a player is usually mid-game,
// and a daily puzzle they've half-finished is a rotten thing to navigate away
// from even with the board saved.
export function ExternalLink({
  href,
  as = "link",
  children,
}: {
  href: string;
  /**
   * "link" sits inside a sentence; "button" is the panel offering an action;
   * "row" is a bordered line whose whole width is the target.
   */
  as?: "link" | "button" | "row";
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={as === "link" ? undefined : `info-${as}`}
    >
      {children}
    </a>
  );
}
