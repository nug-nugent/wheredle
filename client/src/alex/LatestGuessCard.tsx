import { useEffect, useState } from "react";
import type { CategoryDef } from "./categories";
import type { GuessFeedback } from "./engine";
import { COLORS, FONT_FAMILY } from "../theme";
import { TileGrid } from "./TileGrid";

const REVEAL_INTERVAL_MS = 200;

// The most recent guess: always shown in full, rather than collapsed to a
// dot summary like older guesses. `revealing` blinks through each slot in
// turn for a guess that hasn't settled into history yet; everyone else shows
// fully resolved.
export function LatestGuessCard({
  feedback,
  categories,
  revealing,
  onRevealComplete,
}: {
  feedback: GuessFeedback;
  categories: CategoryDef[];
  revealing: boolean;
  onRevealComplete?: () => void;
}) {
  // One slot per category on the day's board, language included — it takes
  // its turn in the ceremony like any other rather than trailing it.
  const slotCount = categories.length;
  const [revealCount, setRevealCount] = useState(revealing ? 0 : slotCount);

  useEffect(() => {
    if (!revealing) {
      setRevealCount(slotCount);
      return;
    }

    setRevealCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setRevealCount(count);
      if (count >= slotCount) {
        clearInterval(timer);
        window.setTimeout(() => onRevealComplete?.(), REVEAL_INTERVAL_MS);
      }
    }, REVEAL_INTERVAL_MS);

    return () => clearInterval(timer);
    // `feedback` changing identity is what should restart the reveal for a
    // new guess; onRevealComplete is re-created every render and isn't a
    // meaningful dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, revealing, slotCount]);

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, padding: 12, marginBottom: 12, fontFamily: FONT_FAMILY }}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{feedback.country.name}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <TileGrid feedback={feedback} categories={categories} revealCount={revealCount} />
      </div>
    </div>
  );
}
