import { Paper, Text } from "@mantine/core";

export type FactCardState = "pending" | "match" | "mismatch";

const BACKGROUND: Record<FactCardState, string> = {
  pending: "var(--mantine-color-gray-light)",
  match: "var(--mantine-color-green-light)",
  mismatch: "var(--mantine-color-red-light)",
};

export function FactCard({
  header,
  label,
  state,
}: {
  header: string;
  label: string;
  state: FactCardState;
}) {
  return (
    <Paper
      withBorder
      p="xs"
      radius="md"
      style={{ backgroundColor: BACKGROUND[state], transition: "background-color 0.15s ease" }}
    >
      <Text size="xs" c="dimmed">
        {header}
      </Text>
      <Text fw={600} size="sm">
        {state === "pending" ? " " : label}
      </Text>
    </Paper>
  );
}
