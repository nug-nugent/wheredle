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
      {/* The ladder shows where the two branches part and leaves the player
          to read the consequence off the colours. That consequence is the
          whole point of an amber chip and it's two facts, not one — the
          answer speaks something in this branch, *and* it doesn't speak this
          language — and the second half was nowhere on the board until the
          rail eventually got round to "not Portuguese". Said here because
          this is what an amber chip already opens: the player asking "how
          close was I?" is the player who needs it.

          Only for amber. A green chip's ladder is green to the bottom and
          says its own piece; a red one shares nothing worth narrating. */}
      {chip.state === "family" && chip.sharedAncestor && (
        <div style={{ fontSize: 12, lineHeight: 1.45, color: COLORS.mutedValue, marginBottom: 4, maxWidth: 380 }}>
          You reached <strong style={{ color: COLORS.text }}>{chip.sharedAncestor}</strong> — the answer speaks
          something in that family, but not {chip.name} itself.
        </div>
      )}
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
