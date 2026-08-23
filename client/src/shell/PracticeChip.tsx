import { COLORS } from "../theme";

// Says which game you're in when it isn't today's. Without it a practice
// board is indistinguishable from the daily one, and a player who started
// practice by accident would think their day's progress had been wiped.
//
// Deliberately quieter than the countdown beside it: it's a standing fact
// about the board, not something that changes as you play.
export function PracticeChip() {
  return (
    <div
      style={{
        border: `1px solid ${COLORS.borderFaint}`,
        color: COLORS.textDimmed,
        fontSize: 11,
        letterSpacing: "0.08em",
        padding: "5px 12px",
        whiteSpace: "nowrap",
      }}
    >
      PRACTICE
    </div>
  );
}
