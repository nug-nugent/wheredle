import { useState } from "react";
import { Menu } from "@mantine/core";
import { AboutPanel } from "../about/AboutPanel";
import { HowToPlayPanel } from "../about/HowToPlayPanel";
import { InfoModal } from "../about/InfoModal";
import { MoreGamesPanel } from "../about/MoreGamesPanel";
import { MODE_LABEL, MODE_URL, OTHER_MODE } from "../mode";
import { COLORS, FONT_FAMILY } from "../theme";

/**
 * The nav's overflow menu — where chrome lives when it doesn't earn a
 * permanent slot in the header: the way in and out of practice games, the
 * link across to the other mode, and the three read-me panels.
 *
 * `onExitPractice` is only passed while a practice game is what's on screen,
 * so it doubles as the flag for which way round the menu should read.
 */
export function NavMenu({
  onNewPractice,
  onExitPractice,
}: {
  onNewPractice: () => void;
  onExitPractice?: () => void;
}) {
  // Which panel is open, if any. The modals are rendered outside the Menu,
  // since Mantine unmounts the dropdown on close — a modal opened from inside
  // it would be torn down in the same breath.
  const [panel, setPanel] = useState<"rules" | "games" | "about" | null>(null);

  return (
    <>
      <Menu
        shadow="md"
        width={200}
        withinPortal
        radius={0}
        position="bottom-end"
        styles={{
          dropdown: { border: `1px solid ${COLORS.border}`, fontFamily: FONT_FAMILY },
          item: { fontFamily: FONT_FAMILY, fontSize: 14, fontWeight: 600, borderRadius: 0 },
        }}
      >
        <Menu.Target>
          <button
            type="button"
            aria-label="Menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              flex: "none",
              border: `1px solid ${COLORS.border}`,
              background: "transparent",
              color: COLORS.text,
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg
              width="18"
              height="12"
              viewBox="0 0 18 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M0 1h18M0 6h18M0 11h18" />
            </svg>
          </button>
        </Menu.Target>
        <Menu.Dropdown>
          {/* Playing comes first, reading about it second: whoever opens this
              menu mid-game is far more often after another go than after the
              credits. */}
          {onExitPractice && <Menu.Item onClick={onExitPractice}>Back to today's puzzle</Menu.Item>}
          <Menu.Item onClick={onNewPractice}>{onExitPractice ? "New practice game" : "Practice game"}</Menu.Item>
          <Menu.Divider />
          <Menu.Item onClick={() => setPanel("rules")}>How to play</Menu.Item>
          <Menu.Item component="a" href={MODE_URL[OTHER_MODE]}>
            Go to {MODE_LABEL[OTHER_MODE]}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item onClick={() => setPanel("games")}>More games</Menu.Item>
          <Menu.Item onClick={() => setPanel("about")}>About</Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <InfoModal opened={panel === "rules"} onClose={() => setPanel(null)} title="How to play">
        <HowToPlayPanel />
      </InfoModal>
      <InfoModal opened={panel === "games"} onClose={() => setPanel(null)} title="More games">
        <MoreGamesPanel />
      </InfoModal>
      <InfoModal opened={panel === "about"} onClose={() => setPanel(null)} title="About Wheredle">
        <AboutPanel />
      </InfoModal>
    </>
  );
}
