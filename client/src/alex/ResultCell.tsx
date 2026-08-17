import { Text } from "@mantine/core";

// A wrapping, roomy alternative to Mantine's Badge — Badge forces single-line
// text with an ellipsis, which mangles longer values like government types
// or multi-currency lists.
export function ResultCell({ match, label }: { match: boolean; label: string }) {
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
