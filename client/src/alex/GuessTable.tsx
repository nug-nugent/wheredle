import { Stack, Table, Text } from "@mantine/core";
import { CATEGORIES, isLanguageConfirmed } from "./categories";
import type { GuessFeedback } from "./engine";
import type { LanguageMatch } from "./languageFamily";

// A wrapping, roomy alternative to Mantine's Badge — Badge forces single-line
// text with an ellipsis, which mangles longer values like government types
// or multi-currency lists.
function ResultCell({ match, label }: { match: boolean; label: string }) {
  return (
    <Text
      fw={500}
      size="sm"
      style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 6,
        lineHeight: 1.3,
        backgroundColor: match ? "var(--mantine-color-green-light)" : "var(--mantine-color-red-light)",
        color: match ? "var(--mantine-color-green-9)" : "var(--mantine-color-red-9)",
      }}
    >
      {label}
    </Text>
  );
}

function LanguageLineage({ match }: { match: LanguageMatch }) {
  return (
    <Stack gap={6} align="flex-start">
      {match.lineage.map((level, i) => (
        <ResultCell key={i} match={i < match.sharedDepth} label={level} />
      ))}
    </Stack>
  );
}

export function GuessTable({ guesses }: { guesses: GuessFeedback[] }) {
  // Once a category has been confirmed (matched by some earlier guess), it
  // moves to the ConfirmedFacts panel and drops out of the table entirely —
  // the table narrows as the game progresses instead of accumulating columns.
  const visibleCategories = CATEGORIES.filter(
    (category) => !guesses.some((f) => category.match(f))
  );
  const languageVisible = !guesses.some(isLanguageConfirmed);

  const columnCount = visibleCategories.length + (languageVisible ? 1 : 0);
  const minWidth = Math.min(2000, 220 + columnCount * 170);

  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table verticalSpacing="md" horizontalSpacing="lg" fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Country</Table.Th>
            {visibleCategories.map((category) => (
              <Table.Th key={category.key}>{category.header}</Table.Th>
            ))}
            {languageVisible && <Table.Th>Language</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {guesses.map((feedback, i) => (
            <Table.Tr
              key={i}
              style={{
                backgroundColor: feedback.correct
                  ? "var(--mantine-color-green-light)"
                  : undefined,
              }}
            >
              <Table.Td>
                <Text fw={700} size="md">
                  {feedback.country.name}
                </Text>
              </Table.Td>
              {visibleCategories.map((category) => (
                <Table.Td key={category.key}>
                  <ResultCell match={category.match(feedback)} label={category.label(feedback)} />
                </Table.Td>
              ))}
              {languageVisible && (
                <Table.Td>
                  <LanguageLineage match={feedback.languageMatch} />
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
