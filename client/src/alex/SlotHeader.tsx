import { useEffect, useState, type ReactNode } from "react";
import { Popover } from "@mantine/core";
import { COLORS, FONT_FAMILY } from "../theme";

// The small-caps label at the top of a board slot, and the control for that
// slot's explanation. Shared by the tiles and the languages box so a board
// has one affordance rather than two that look alike and behave differently.
//
// The label is the target rather than the whole slot, which was the obvious
// alternative and doesn't work: the languages box is already full of
// buttons — each chip opens its own lineage ladder — so a click handler
// wrapping the slot would fire on every chip press as well. Putting it on
// the label keeps one gesture per thing and leaves the chips alone.
//
// The dotted underline is doing real work. Nothing else on this board is
// clickable-but-not-obviously-so, and a bare header that silently responds
// to a tap is a feature nobody finds; the dotted rule is the one convention
// that reads as "this word has a definition" without adding a glyph to a
// header row that has no space for one — "HUMAN DEVELOPMENT INDEX" already
// fills its tile at 10px.
// Only one explanation stands open at a time. Mantine shuts a popover when
// you mousedown outside it, which covers every pointer route and not the
// keyboard one: pressing Enter on a second header fires a click with no
// mousedown ahead of it, so the first stayed open and the two overlapped
// mid-board. Whoever is open leaves a closer here for the next one to call,
// which makes the rule the same however the header was reached.
let closeOpenPopover: (() => void) | null = null;

export function SlotHeader({
  header,
  explain,
  lines,
  color,
  trailing,
}: {
  header: string;
  /** What the column measures. Omit to render an inert label — a slot still
   *  blinking through the reveal has no state to describe yet. */
  explain?: string;
  /** What this particular result means, where the colour doesn't say it. */
  lines?: string[];
  color: string;
  /** The tick or cross, kept in the header row but outside the target. */
  trailing?: ReactNode;
}) {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!opened) return;

    const close = () => setOpened(false);
    closeOpenPopover?.();
    closeOpenPopover = close;

    // Escape closes it, from wherever focus happens to be. Mantine's own
    // handling is bound to the dropdown and the trigger keeps the focus when
    // a popover opens, so out of the box a keyboard player could open one
    // and have nothing that shuts it — and a tap on the dropdown itself
    // moves focus again, which put it out of reach of a handler on the
    // button too.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      // Only if nobody has opened since — the popover that replaced this one
      // registered itself here and its closer has to survive.
      if (closeOpenPopover === close) closeOpenPopover = null;
    };
  }, [opened]);

  // No explanation to give — a slot still blinking through the reveal. The
  // same row without the button or the dotted rule, so nothing invites a tap
  // at a moment there'd be nothing behind it.
  if (!explain) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color }}>{header}</span>
        {trailing}
      </div>
    );
  }

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      withArrow
      radius={0}
      width={280}
      shadow="md"
      // Click, not hover: half the players are on a phone, where a hover
      // target is one that can't be opened at all.
      trapFocus={false}
      withinPortal
      // The board lives in its own scrolling pane, so a tile can sit a few
      // pixels above the fold with nothing below it to open into. Flipping
      // above the header covers that; shifting keeps a 280px dropdown off a
      // phone's left and right edges, which "bottom-start" alone does not
      // for the rightmost tile in a row.
      middlewares={{ flip: true, shift: { padding: 8 } }}
    >
      <Popover.Target>
        <button
          type="button"
          onClick={() => setOpened((o) => !o)}
          aria-expanded={opened}
          aria-label={`What ${header} means`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            width: "100%",
            // Widens the tap target into the slot's own padding without
            // moving the label off the line it sits on now.
            padding: "3px 0",
            margin: "-3px 0 -1px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: FONT_FAMILY,
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color,
              borderBottom: `1px dotted ${color}`,
            }}
          >
            {header}
          </span>
          {trailing}
        </button>
      </Popover.Target>
      <Popover.Dropdown
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          fontFamily: FONT_FAMILY,
          padding: "10px 12px",
        }}
      >
        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: COLORS.text }}>{explain}</div>
        {/* What this result means is kept visibly apart from what the column
            is: one is the same every day and the other is about the guess in
            front of you, and running them together as one paragraph makes
            the fixed half look like it's also about this guess. */}
        {lines?.map((line) => (
          <div
            key={line}
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: `1px solid ${COLORS.borderFaint}`,
              fontSize: 12.5,
              lineHeight: 1.45,
              color: COLORS.mutedValue,
            }}
          >
            {line}
          </div>
        ))}
      </Popover.Dropdown>
    </Popover>
  );
}
