import { useEffect, useState } from "react";
import { dayNumber, msUntilNextDay } from "../daily";
import { COLORS, FONT_FAMILY } from "../theme";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
}

// A game holds the day it was dealt for its whole life, so a tab left open
// across midnight is playing yesterday's puzzle while today's already
// exists. Comparing the game's day against the clock's is what tells the
// two apart — the countdown alone can't, since it always runs to the *next*
// midnight and so cheerfully offers "11 hours to go" on a puzzle that
// arrived hours ago.
function nextPuzzle(day: number): { ready: boolean; remaining: number } {
  return { ready: dayNumber() > day, remaining: msUntilNextDay() };
}

// What's left of a finished daily game: how long until there's another one,
// or an invitation to go and play it once there is.
//
// Crossing midnight doesn't take the board away by itself — the player may
// still be reading their reveal, and a page that reloads itself out from
// under them is worse than a stale countdown. So the new puzzle is offered
// rather than imposed, and it's the click that reloads.
export function NextPuzzleCountdown({ day }: { day: number }) {
  const [{ ready, remaining }, setStatus] = useState(() => nextPuzzle(day));

  useEffect(() => {
    const timer = setInterval(() => setStatus(nextPuzzle(day)), 1000);
    return () => clearInterval(timer);
  }, [day]);

  if (ready) {
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          fontFamily: FONT_FAMILY,
          marginTop: 16,
          padding: 0,
          border: "none",
          background: "transparent",
          textAlign: "left",
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.text,
          cursor: "pointer",
        }}
      >
        A new daily puzzle is available.{" "}
        <span style={{ color: COLORS.accent, textDecoration: "underline" }}>Click here to play it.</span>
      </button>
    );
  }

  return (
    <div style={{ fontFamily: FONT_FAMILY, marginTop: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.07em", textTransform: "uppercase", color: COLORS.textDimmed }}>
        Next puzzle in
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{format(remaining)}</div>
    </div>
  );
}
