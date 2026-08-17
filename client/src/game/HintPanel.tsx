import { Badge, Group, Image, Stack, Text } from "@mantine/core";
import type { Country } from "../data/country";
import type { Hint } from "./engine";
import { FlagOverview } from "./FlagOverview";
import { FlagSegment } from "./FlagSegment";

const LABELS: Record<Hint["type"], string> = {
  letter: "Contains the letter",
  flagSegment: "Flag segment",
  continent: "Continent",
  population: "Population",
  language: "Language(s)",
  fullFlag: "Full flag",
};

function HintValue({ hint, target }: { hint: Hint; target: Country }) {
  switch (hint.type) {
    case "letter":
      return <Text fw={700}>{hint.letter}</Text>;
    case "flagSegment":
      return (
        <Group gap="xs" align="flex-start" wrap="wrap">
          <FlagOverview flagUrl={target.flagUrl} focalX={hint.focalX} focalY={hint.focalY} />
          <FlagSegment flagUrl={target.flagUrl} focalX={hint.focalX} focalY={hint.focalY} />
        </Group>
      );
    case "continent":
      return <Badge>{target.continent}</Badge>;
    case "population":
      return <Text fw={700}>{target.population.toLocaleString()}</Text>;
    case "language":
      return <Text fw={700}>{target.languages.join(", ")}</Text>;
    case "fullFlag":
      return (
        <Image src={target.flagUrl} alt="Full flag" w={200} h={120} fit="contain" />
      );
  }
}

export function HintPanel({ hints, target }: { hints: Hint[]; target: Country }) {
  return (
    <Group gap="xl" align="flex-start" wrap="wrap">
      {hints.map((hint, i) => (
        <Stack key={i} gap={4} align="flex-start">
          <Text size="xs" c="dimmed">
            Q{i + 1} — {LABELS[hint.type]}
          </Text>
          <HintValue hint={hint} target={target} />
        </Stack>
      ))}
    </Group>
  );
}
