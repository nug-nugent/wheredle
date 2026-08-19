import { useState } from "react";
import { Chip } from "./Chip";
import { LanguageLineage } from "./LanguageLineage";
import type { LanguageChip, LanguageChipState } from "./engine";
import { COLORS, FONT_FAMILY } from "../theme";

function chipTone(state: LanguageChipState) {
  return state === "correct" ? "correct" : state === "family" ? "partial" : "wrong";
}

// How far a match runs as a fraction of the language's own lineage, which
// is what the chip's tint ramps over. A language outside the taxonomy has
// no lineage to be a fraction of, so it sits at the faint end.
function chipStrength(chip: LanguageChip): number {
  return chip.lineage.length === 0 ? 0 : chip.sharedDepth / chip.lineage.length;
}

// The Languages slot of a guess: one chip per language the guessed country
// speaks, each opening into its own lineage ladder, one at a time. Shared
// by the latest-guess card and the expanded history rows, which show it
// identically. `revealed` is false while the latest guess is still blinking
// its slots in — the box keeps its header and shape, and the chips arrive
// on cue with the tiles.
//
// Returns two siblings rather than one box, because callers lay their tiles
// out in a wrapping flex row: an open ladder inside the box would make it
// the tallest item on its line and stretch every tile beside it into a
// full-height slab. The ladder instead takes flexBasis 100%, which drops it
// onto a line of its own underneath.
export function LanguageBox({ chips, revealed = true }: { chips: LanguageChip[]; revealed?: boolean }) {
  const [openLanguage, setOpenLanguage] = useState<string | null>(null);
  const open = chips.find((c) => c.name === openLanguage);

  return (
    <>
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          padding: "6px 9px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          minWidth: 176,
          fontFamily: FONT_FAMILY,
        }}
      >
        <span style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: COLORS.textDimmed }}>
          Languages
        </span>
        {revealed && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chips.map((c) => (
              <Chip
                key={c.name}
                name={c.name}
                tone={chipTone(c.state)}
                ancestor={c.state === "family" ? c.sharedAncestor : undefined}
                strength={chipStrength(c)}
                expanded={c.name === openLanguage}
                onClick={
                  c.lineage.length > 0
                    ? () => setOpenLanguage((name) => (name === c.name ? null : c.name))
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
      {revealed && open && <div style={{ flexBasis: "100%" }}><LanguageLineage chip={open} /></div>}
    </>
  );
}
