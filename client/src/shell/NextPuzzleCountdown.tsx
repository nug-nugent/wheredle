import { useEffect, useState } from "react";
import { msUntilNextDay } from "../daily";
import { COLORS, FONT_FAMILY } from "../theme";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

// What's left of a finished daily game: how long until there's another one.
// The day rolls over at local midnight, so this is simply the time to it —
// and when it reaches zero the puzzle really has changed, which is why it
// reloads rather than quietly leaving the player on yesterday's board.
export function NextPuzzleCountdown() {
  const [remaining, setRemaining] = useState(msUntilNextDay);

  useEffect(() => {
    const timer = setInterval(() => {
      const left = msUntilNextDay();
      setRemaining(left);
      if (left <= 0) window.location.reload();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ fontFamily: FONT_FAMILY, marginTop: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: COLORS.textDimmed }}>
        Next puzzle in
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{format(remaining)}</div>
    </div>
  );
}
