import { COLORS, FONT_FAMILY } from "../theme";
import type { LanguageChip } from "./engine";

// The full ancestry behind one chip, broadest family at the top and
// indented into a tree. Every level above `sharedDepth` is shared with the
// target and shows green; below that is red, where the two branches part.
// It's the detail the chip's "via Germanic" line summarises — how far up
// you have to climb before the guess and the target meet.
export function LanguageLineage({ chip }: { chip: LanguageChip }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        fontFamily: FONT_FAMILY,
      }}
    >
      {chip.lineage.map((level, i) => {
        const shared = i < chip.sharedDepth;
        return (
          <span
            key={level}
            style={{
              marginLeft: i * 10,
              padding: "2px 7px",
              fontSize: 11,
              fontWeight: 600,
              background: shared ? COLORS.correctBg : COLORS.wrongBg,
              color: shared ? COLORS.correctValue : COLORS.wrongValue,
            }}
          >
            {level}
          </span>
        );
      })}
    </div>
  );
}
