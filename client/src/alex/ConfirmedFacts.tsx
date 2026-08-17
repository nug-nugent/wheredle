import { Group, Paper, Stack, Text } from "@mantine/core";
import type { ConfirmedFact } from "./categories";

export function ConfirmedFacts({ facts }: { facts: ConfirmedFact[] }) {
  if (facts.length === 0) return null;

  return (
    <Stack gap={6}>
      <Text size="xs" c="dimmed">
        Confirmed
      </Text>
      <Group gap="sm">
        {facts.map((fact) => (
          <Paper
            key={fact.key}
            withBorder
            p="xs"
            radius="md"
            style={{ backgroundColor: "var(--mantine-color-green-light)" }}
          >
            <Text size="xs" c="dimmed">
              {fact.header}
            </Text>
            <Text fw={600} size="sm">
              {fact.label}
            </Text>
          </Paper>
        ))}
      </Group>
    </Stack>
  );
}
