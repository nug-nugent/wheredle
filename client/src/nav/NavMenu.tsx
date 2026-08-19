import { Menu } from "@mantine/core";
import { COLORS, FONT_FAMILY } from "../theme";

/**
 * The nav's overflow menu — where chrome lives when it doesn't earn a
 * permanent slot in the header. Right now that's only "New game", which
 * retires once the daily seed lands; the rules and links across to the
 * other mode are the expected next tenants.
 */
export function NavMenu({ onNewGame }: { onNewGame: () => void }) {
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
        <Menu.Item onClick={onNewGame}>New game</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
