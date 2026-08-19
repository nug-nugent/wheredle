import { useEffect, useState } from "react";
import { CATEGORIES } from "./categories";
import type { GuessFeedback } from "./engine";
import { LanguageBox } from "./LanguageBox";
import { COLORS, FONT_FAMILY } from "../theme";
import { Tile } from "./Tile";

const REVEAL_INTERVAL_MS = 200;
// One slot per tile, plus one for the language box.
const REVEAL_SLOT_COUNT = CATEGORIES.length + 1;

// The most recent guess: always shown in full (tiles + language chips),
// rather than collapsed to a dot summary like older guesses. `revealing`
// blinks through each slot in turn for a guess that hasn't settled into
// history yet; everyone else shows fully resolved.
export function LatestGuessCard({
  feedback,
  revealing,
  onRevealComplete,
}: {
  feedback: GuessFeedback;
  revealing: boolean;
  onRevealComplete?: () => void;
}) {
  const [revealCount, setRevealCount] = useState(revealing ? 0 : REVEAL_SLOT_COUNT);

  useEffect(() => {
    if (!revealing) {
      setRevealCount(REVEAL_SLOT_COUNT);
      return;
    }

    setRevealCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setRevealCount(count);
      if (count >= REVEAL_SLOT_COUNT) {
        clearInterval(timer);
        window.setTimeout(() => onRevealComplete?.(), REVEAL_INTERVAL_MS);
      }
    }, REVEAL_INTERVAL_MS);

    return () => clearInterval(timer);
    // `feedback` changing identity is what should restart the reveal for a
    // new guess; onRevealComplete is re-created every render and isn't a
    // meaningful dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback, revealing]);

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, padding: 12, marginBottom: 12, fontFamily: FONT_FAMILY }}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{feedback.country.name}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {CATEGORIES.map((category, i) => (
          <Tile
            key={category.key}
            label={category.header}
            value={i < revealCount ? category.label(feedback) : ""}
            state={i < revealCount ? category.flag(feedback) : "pending"}
          />
        ))}

        <LanguageBox chips={feedback.languageChips} revealed={revealCount > CATEGORIES.length} />
      </div>
    </div>
  );
}
