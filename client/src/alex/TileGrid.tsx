import type { CategoryDef } from "./categories";
import type { GuessFeedback } from "./engine";
import { LanguageBox } from "./LanguageBox";
import { Tile } from "./Tile";

// Every category of one guess, drawn in board order — unwrapped, since
// callers provide their own flex/grid container: the surrounding layout
// differs between the latest-guess card and a collapsed history row.
//
// `revealCount` blinks the slots in one at a time for a guess that hasn't
// settled into history yet; omit it and everything shows fully resolved.
// Each category knows which cell it draws, so language arrives here as one
// slot among the tiles rather than as a sibling the callers have to
// remember to append.
export function TileGrid({
  feedback,
  categories,
  revealCount,
}: {
  feedback: GuessFeedback;
  categories: CategoryDef[];
  revealCount?: number;
}) {
  return (
    <>
      {categories.map((category, i) => {
        const revealed = revealCount === undefined || i < revealCount;

        if (category.cell === "chips") {
          return <LanguageBox key={category.key} chips={feedback.languageChips} revealed={revealed} />;
        }

        return (
          <Tile
            key={category.key}
            label={category.header}
            value={revealed ? category.label(feedback) : ""}
            detail={revealed ? category.detail?.(feedback) : undefined}
            state={revealed ? category.square(feedback) : "pending"}
          />
        );
      })}
    </>
  );
}
