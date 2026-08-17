import { Button, Group, Text } from "@mantine/core";
import type { ChoosableHintType } from "./engine";

const LABELS: Record<ChoosableHintType, string> = {
  continent: "Continent",
  population: "Population",
  language: "Language",
};

export function ChoicePrompt({
  options,
  onChoose,
}: {
  options: ChoosableHintType[];
  onChoose: (hint: ChoosableHintType) => void;
}) {
  return (
    <Group gap="sm" align="center">
      <Text size="sm" c="dimmed">
        Pick your next hint:
      </Text>
      {options.map((opt) => (
        <Button key={opt} variant="light" onClick={() => onChoose(opt)}>
          {LABELS[opt]}
        </Button>
      ))}
    </Group>
  );
}
