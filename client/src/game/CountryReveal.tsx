import { Badge, Group, Image, Stack, Text } from "@mantine/core";
import type { Country } from "../data/country";

export function CountryReveal({ country }: { country: Country }) {
  return (
    <Group gap="lg" align="flex-start" wrap="wrap">
      <Image
        src={country.flagUrl}
        alt={`Flag of ${country.name}`}
        w={240}
        h={144}
        fit="contain"
      />
      <Stack gap={4}>
        <Text size="xl" fw={700}>
          {country.name}
        </Text>
        <Badge w="fit-content">{country.continent}</Badge>
        <Text size="sm">
          <Text span fw={600}>
            Capital:
          </Text>{" "}
          {country.capital ?? "—"}
        </Text>
        <Text size="sm">
          <Text span fw={600}>
            Population:
          </Text>{" "}
          {country.population.toLocaleString()}
        </Text>
        <Text size="sm">
          <Text span fw={600}>
            Language(s):
          </Text>{" "}
          {country.languages.join(", ")}
        </Text>
      </Stack>
    </Group>
  );
}
