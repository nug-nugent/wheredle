import { Group, Paper, Text } from "@mantine/core";
import { CATEGORIES } from "./categories";
import type { GuessFeedback } from "./engine";
import { FactCard } from "./FactCard";
import { LanguageLineage } from "./LanguageLineage";

// Every non-language category, plus one slot for language.
export const GUESS_SLOT_COUNT = CATEGORIES.length + 1;

// The header-labelled fact cards for a single guess, flowing together so
// they wrap naturally on any screen width. `revealCount` lets LastGuess
// blink slots in one at a time during its reveal ceremony; omit it to show
// every card already resolved.
export function GuessFactCards({
  feedback,
  revealCount = GUESS_SLOT_COUNT,
}: {
  feedback: GuessFeedback;
  revealCount?: number;
}) {
  return (
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
  );
}
