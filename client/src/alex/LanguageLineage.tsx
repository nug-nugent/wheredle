import { Stack } from "@mantine/core";
import type { LanguageMatch } from "./languageFamily";
import { ResultCell } from "./ResultCell";

export function LanguageLineage({ match }: { match: LanguageMatch }) {
  return (
    <Stack gap={6} align="flex-start">
      {match.lineage.map((level, i) => (
        <ResultCell key={i} match={i < match.sharedDepth} label={level} />
      ))}
    </Stack>
  );
}
