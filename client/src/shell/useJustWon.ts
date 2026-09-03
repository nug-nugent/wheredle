import { useRef } from "react";

// True only for a win that happened while the player was watching.
//
// The end-of-game panel can't tell the difference on its own: a game won
// just now and a game won yesterday and reopened both mount it with the
// same props. So the mode's hook has to say, and the only evidence is
// whether this tab ever saw the game in play. Reopening a finished game
// should feel like reading a result, not like winning it again.
export function useJustWon(status: "playing" | "won" | "lost"): boolean {
  const sawPlaying = useRef(false);
  if (status === "playing") sawPlaying.current = true;
  return status === "won" && sawPlaying.current;
}
