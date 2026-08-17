import { useEffect, useState } from "react";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { CATEGORIES } from "./categories";
import type { GuessFeedback } from "./engine";
import { FactCard } from "./FactCard";
import { LanguageLineage } from "./LanguageLineage";

const REVEAL_INTERVAL_MS = 200;
// Every non-language category, plus one slot for language.
const SLOT_COUNT = CATEGORIES.length + 1;

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
  const [revealCount, setRevealCount] = useState(revealing ? 0 : SLOT_COUNT);

  useEffect(() => {
    if (!revealing) {
      setRevealCount(SLOT_COUNT);
      return;
    }

    setRevealCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      setRevealCount(count);
      if (count >= SLOT_COUNT) {
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
      <Group gap="sm" align="flex-start">
        {CATEGORIES.map((category, i) =>
          i < revealCount ? (
            <FactCard
              key={category.key}
              header={category.header}
              label={category.label(feedback)}
              state={category.match(feedback) ? "match" : "mismatch"}
            />
          ) : (
            <FactCard key={category.key} header={category.header} label="" state="pending" />
          )
        )}
        {revealCount > CATEGORIES.length ? (
          <Paper withBorder p="xs" radius="md">
            <Text size="xs" c="dimmed">
              Language
            </Text>
            <LanguageLineage match={feedback.languageMatch} />
          </Paper>
        ) : (
          <FactCard header="Language" label="" state="pending" />
        )}
      </Group>
    </Stack>
  );
}
