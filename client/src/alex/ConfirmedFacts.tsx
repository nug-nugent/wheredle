import { Group, Stack, Text } from "@mantine/core";
import type { ConfirmedFact } from "./categories";
import { FactCard } from "./FactCard";

export function ConfirmedFacts({ facts }: { facts: ConfirmedFact[] }) {
  if (facts.length === 0) return null;

  return (
    <Stack gap={6}>
      <Text size="xs" c="dimmed">
        Confirmed
      </Text>
      <Group gap="sm">
        {facts.map((fact) => (
          <FactCard key={fact.key} header={fact.header} label={fact.label} state="match" />
        ))}
      </Group>
    </Stack>
  );
}
