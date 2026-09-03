import { useRef, useState } from "react";
import { Menu } from "@mantine/core";
import { COLORS, FONT_FAMILY } from "../theme";

export interface ShareScoreProps {
  /** e.g. "Wheredle" or "Wheredle: Alex Mode" */
  gameLabel: string;
  /** Which day's puzzle, so two grids can be compared. Omitted for practice. */
  puzzleNumber?: number;
  /** e.g. "4/7" or "Solved in 6" */
  resultLabel: string;
  /** One emoji row per guess, oldest first — the Wordle-style score grid. */
  rows: string[];
}

function currentUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

// "Wheredle: Alex Mode #12 Solved in 5". The puzzle number is what makes two
// grids comparable — without it a shared score says nothing about which day
// it was won on. Practice games have no number and so quote none.
function headline({ gameLabel, puzzleNumber, resultLabel }: ShareScoreProps): string {
  return puzzleNumber === undefined
    ? `${gameLabel} ${resultLabel}`
    : `${gameLabel} #${puzzleNumber} ${resultLabel}`;
}

function buildShareText(props: ShareScoreProps): string {
  return [headline(props), "", ...props.rows, "", currentUrl()].join("\n");
}

// What a share sheet shows as the item's name, and what some targets surface
// instead of the body — so it carries the number too, rather than leaving a
// shared score with no way to tell which day it was.
function shareTitle({ gameLabel, puzzleNumber }: ShareScoreProps): string {
  return puzzleNumber === undefined ? gameLabel : `${gameLabel} #${puzzleNumber}`;
}

const BUTTON_STYLE = {
  fontFamily: FONT_FAMILY,
  fontWeight: 800,
  fontSize: 14,
  background: COLORS.accent,
  color: COLORS.surface,
  border: `1px solid ${COLORS.accent}`,
  padding: "10px 20px",
  cursor: "pointer",
  // Never squashed by a row running out of width: the row stacks its
  // buttons instead, and a button that shrank would wrap its own label
  // rather than let that happen.
  flexShrink: 0,
  whiteSpace: "nowrap",
} as const;

export function ShareScoreButton(props: ShareScoreProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shareText = buildShareText(props);
  const payload = { title: shareTitle(props), text: shareText };

  // A share sheet can't open and be picked from in this long, so a resolve
  // this fast means nothing opened at all — see nativeShare.
  const INSTANT_RESOLVE_MS = 300;

  const copyToClipboard = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(shareText);
      return true;
    } catch {
      // Denied or unavailable. The caller says nothing rather than claiming a
      // copy that didn't happen.
      return false;
    }
  };

  const flagCopied = () => {
    clearTimeout(copiedTimeout.current);
    setCopied(true);
    copiedTimeout.current = setTimeout(() => setCopied(false), 2000);
  };

  const copyFromMenu = async () => {
    if (await copyToClipboard()) flagCopied();
  };

  // Where the platform has a share sheet — every mobile browser, and most
  // desktop ones — that sheet is the share UI: it lists whatever the player
  // actually messages their friends on, which our own menu never could. So
  // it stays the button, one tap, as it was.
  //
  // Desktop Edge is the exception that makes this fiddly: it advertises the
  // API, resolves the promise, and never opens anything, so the button used
  // to do nothing at all. There's no capability query that tells that apart
  // from a working sheet, so it's caught after the fact — an instant resolve
  // means no sheet appeared, and the player gets the copy instead.
  //
  // The copy is started *before* the share and never awaited first, because
  // both need the click's transient activation and neither gets it back once
  // a promise has been awaited. On a phone it costs a clipboard write nobody
  // sees; everywhere else it's the difference between a fallback and none.
  const nativeShare = () => {
    const copying = copyToClipboard();
    const startedAt = Date.now();

    const fallBackToCopy = async () => {
      if (await copying) flagCopied();
    };

    navigator.share(payload).then(
      () => {
        if (Date.now() - startedAt < INSTANT_RESOLVE_MS) void fallBackToCopy();
      },
      (error: DOMException) => {
        // AbortError means the player dismissed the sheet — nothing to do.
        // Anything else means the sheet never opened.
        if (error.name !== "AbortError") void fallBackToCopy();
      }
    );
  };

  const canNativeShare = typeof navigator.share === "function" && (navigator.canShare?.(payload) ?? true);

  if (canNativeShare) {
    return (
      <button type="button" style={BUTTON_STYLE} onClick={nativeShare}>
        {copied ? "Copied to clipboard!" : "Share score"}
      </button>
    );
  }

  return (
    <Menu
      shadow="md"
      width={220}
      withinPortal
      radius={0}
      styles={{
        dropdown: { border: `1px solid ${COLORS.border}`, fontFamily: FONT_FAMILY },
        item: { fontFamily: FONT_FAMILY, fontSize: 14, borderRadius: 0 },
      }}
    >
      <Menu.Target>
        <button type="button" style={BUTTON_STYLE}>
          {copied ? "Copied to clipboard!" : "Share score"}
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection="📋"
          closeMenuOnClick={false}
          onClick={() => void copyFromMenu()}
        >
          {copied ? "Copied to clipboard!" : "Copy to clipboard"}
        </Menu.Item>
        <Menu.Item
          component="a"
          leftSection="💬"
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </Menu.Item>
        <Menu.Item
          component="a"
          leftSection="✉️"
          href={`mailto:?subject=${encodeURIComponent(
            `${props.gameLabel} ${props.resultLabel}`
          )}&body=${encodeURIComponent(shareText)}`}
        >
          Email
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
