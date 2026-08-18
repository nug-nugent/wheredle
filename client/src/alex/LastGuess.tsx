import { useEffect, useState } from "react";
import { Stack, Text } from "@mantine/core";
import type { GuessFeedback } from "./engine";
import { GUESS_SLOT_COUNT, GuessFactCards } from "./GuessFactCards";

const REVEAL_INTERVAL_MS = 200;

export function LastGuess({
  feedback,
  revealing,
  onRevealComplete,
}: {
  feedback: GuessFeedback;
  // True while this guess's result hasn't been added to the confirmed/
  // history views yet — the panel blinks through each category as it
  // reveals. False once it's just the persisted "last guess" recap.
  revealing: boolean;
  onRevealComplete?: () => void;
}) {
  const [revealCount, setRevealCount] = useState(revealing ? 0 : GUESS_SLOT_COUNT);

  useEffect(() => {
    if (!revealing) {
      setRevealCount(GUESS_SLOT_COUNT);
      return;
    }

    setRevealCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setRevealCount(count);
      if (count >= GUESS_SLOT_COUNT) {
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
    <Stack gap={6}>
      <Text size="xs" c="dimmed">
        Last guess: {feedback.country.name}
      </Text>
      <GuessFactCards feedback={feedback} revealCount={revealCount} />
    </Stack>
  );
}
