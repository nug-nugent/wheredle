import { Stack, Text } from "@mantine/core";
import type { GuessFeedback } from "./engine";
import { GuessFactCards } from "./GuessFactCards";

// Every past guess shows every category, including ones already confirmed
// elsewhere — a guess can be right on some categories and wrong on others
// (a country can share one language of several, say), so hiding confirmed
// categories here would hide that nuance.
export function GuessHistory({ guesses }: { guesses: GuessFeedback[] }) {
  return (
    <Stack gap="md">
      {guesses.map((feedback) => (
        <Stack gap={6} key={feedback.country.cca3}>
          <Text size="xs" c="dimmed">
            {feedback.country.name}
          </Text>
          <GuessFactCards feedback={feedback} />
        </Stack>
      ))}
    </Stack>
  );
}
