import { useState } from "react";
import { Autocomplete } from "@mantine/core";
import type { Country } from "../data/country";
import { COLORS, FONT_FAMILY } from "../theme";
import { COUNTRY_NAMES, findCountryByName, MIN_SEARCH_LENGTH, normalizeCountryName } from "./countryMatch";

export function GuessInput({
  onGuess,
  guessedNames,
  disabled,
}: {
  onGuess: (country: Country) => void;
  guessedNames?: ReadonlySet<string>;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (next: string) => {
    setValue(next);
    setError(null);
  };

  const submit = () => {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const matched = findCountryByName(trimmed);
    if (!matched) {
      setError("Not a recognised country.");
      return;
    }
    if (guessedNames?.has(matched.name)) {
      setError("Already guessed.");
      return;
    }
    onGuess(matched);
    setValue("");
    setError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Autocomplete
          autoFocus
          placeholder="Guess a country..."
          data={COUNTRY_NAMES}
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          filter={({ options, search }) => {
            if (search.trim().length < MIN_SEARCH_LENGTH) return [];
            const query = normalizeCountryName(search);
            return options.filter(
              (option) =>
                "label" in option &&
                normalizeCountryName(option.label).includes(query) &&
                !guessedNames?.has(option.label)
            );
          }}
          disabled={disabled}
          radius={0}
          styles={{
            input: {
              fontFamily: FONT_FAMILY,
              fontSize: 14,
              minHeight: 40,
              background: COLORS.inputBg,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.text,
            },
          }}
          style={{ flex: "1 1 220px", maxWidth: 460 }}
        />
        <button
          onClick={submit}
          disabled={disabled}
          style={{
            fontFamily: FONT_FAMILY,
            fontWeight: 800,
            fontSize: 14,
            background: COLORS.accent,
            color: COLORS.surface,
            border: `1px solid ${COLORS.accent}`,
            padding: "10px 22px",
            cursor: disabled ? "default" : "pointer",
            opacity: disabled ? 0.45 : 1,
          }}
        >
          Guess
        </button>
      </div>
      {error && (
        <span style={{ fontSize: 12, color: COLORS.accentHover, fontFamily: FONT_FAMILY }}>{error}</span>
      )}
    </div>
  );
}
