import { Menu } from "@mantine/core";
import { COLORS, FONT_FAMILY } from "../theme";

/**
 * The nav's overflow menu — where chrome lives when it doesn't earn a
 * permanent slot in the header. Now that the puzzle is a daily one, that's
 * the way in and out of practice games; the rules and links across to the
 * other mode are the expected next tenants.
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
  return (
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
        {onExitPractice && <Menu.Item onClick={onExitPractice}>Back to today's puzzle</Menu.Item>}
        <Menu.Item onClick={onNewPractice}>{onExitPractice ? "New practice game" : "Practice game"}</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
