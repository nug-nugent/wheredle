import { useRef, useState } from "react";
import { Menu } from "@mantine/core";
import { COLORS, FONT_FAMILY } from "../theme";

export interface ShareScoreProps {
  /** e.g. "Wheredle" or "Wheredle: Alex Mode" */
  gameLabel: string;
  /** e.g. "4/7" or "Solved in 6" */
  resultLabel: string;
  /** One emoji string per guess, oldest first — the Wordle-style score grid. */
  rows: string[];
}

function currentUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildShareText({ gameLabel, resultLabel, rows }: ShareScoreProps): string {
  return [`${gameLabel} ${resultLabel}`, "", ...rows, "", currentUrl()].join("\n");
}

export function ShareScoreButton(props: ShareScoreProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const shareText = buildShareText(props);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareText);
    clearTimeout(copiedTimeout.current);
    setCopied(true);
    copiedTimeout.current = setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = () => {
    // Fire-and-forget: a rejected promise here just means the user
    // dismissed the OS share sheet, which needs no handling.
    void navigator.share({ title: props.gameLabel, text: shareText });
  };

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
        <button
          style={{
            fontFamily: FONT_FAMILY,
            fontWeight: 800,
            fontSize: 14,
            background: COLORS.accent,
            color: COLORS.surface,
            border: `1px solid ${COLORS.accent}`,
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
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
        {typeof navigator.share === "function" && (
          <Menu.Item leftSection="📤" onClick={nativeShare}>
            More options…
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
