import { CATEGORIES } from "./categories";
import type { GuessFeedback } from "./engine";
import { Tile } from "./Tile";

// Just the tiles, unwrapped — callers provide their own flex/grid container
// since the surrounding layout differs between the latest-guess card and a
// collapsed history row.
export function TileGrid({ feedback }: { feedback: GuessFeedback }) {
  return (
    <>
      {CATEGORIES.map((category) => (
        <Tile key={category.key} label={category.header} value={category.label(feedback)} state={category.flag(feedback)} />
      ))}
    </>
  );
}
