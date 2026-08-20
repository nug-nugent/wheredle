import { useRef, useState } from "react";
import { Menu } from "@mantine/core";
import { COLORS, FONT_FAMILY } from "../theme";

export interface ShareScoreProps {
  /** e.g. "Wheredle" or "Wheredle: Alex Mode" */
  gameLabel: string;
  /** e.g. "4/7" or "Solved in 6" */
  resultLabel: string;
  /** One emoji row per guess, oldest first — the Wordle-style score grid. */
  rows: string[];
}

function currentUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildShareText({ gameLabel, resultLabel, rows }: ShareScoreProps): string {
  return [`${gameLabel} ${resultLabel}`, "", ...rows, "", currentUrl()].join("\n");
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
} as const;

export function ShareScoreButton(props: ShareScoreProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shareText = buildShareText(props);
  const payload = { title: props.gameLabel, text: shareText };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Clipboard access denied or unavailable — say nothing rather than
      // claim a copy that didn't happen.
      return;
    }
    clearTimeout(copiedTimeout.current);
    setCopied(true);
    copiedTimeout.current = setTimeout(() => setCopied(false), 2000);
  };

  // Where the platform has a share sheet — every mobile browser, and most
  // desktop ones — that sheet is the share UI: it lists whatever the player
  // actually messages their friends on, which our own menu never could.
  // navigator.share needs the click's transient activation, so it has to be
  // the first thing the handler does, before any await.
  const nativeShare = () => {
    navigator.share(payload).catch((error: DOMException) => {
      // AbortError means the player dismissed the sheet — nothing to do.
      // Anything else means the sheet never opened, so fall back to a copy.
      if (error.name !== "AbortError") void copyToClipboard();
    });
  };

  if (typeof navigator.share === "function" && (navigator.canShare?.(payload) ?? true)) {
    return (
      <button type="button" style={BUTTON_STYLE} onClick={nativeShare}>
        {copied ? "Copied to clipboard!" : "Share your score"}
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
          Share your score
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection="📋"
          closeMenuOnClick={false}
          onClick={() => void copyToClipboard()}
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
