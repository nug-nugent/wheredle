import { useRef, useState } from "react";
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
  const [selected, setSelected] = useState<Country | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Selecting an option triggers our onChange too (Mantine syncs the input
  // value to the picked label) — this ref tells that follow-up onChange not
  // to wipe out the selection it's the one that caused.
  const justSelectedRef = useRef(false);

  const handleChange = (next: string) => {
    setValue(next);
    setError(null);
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
    } else {
      setSelected(null);
    }
  };

  const handleOptionSubmit = (name: string) => {
    justSelectedRef.current = true;
    setSelected(findCountryByName(name) ?? null);
    setError(null);
  };

  // A dropdown pick sets `selected` directly; typing the full name and
  // hitting Enter/Guess without opening the dropdown never does, so fall
  // back to an exact (normalized) name match against the typed value.
  const matchedCountry = selected ?? findCountryByName(value);

  const submit = () => {
    const country = matchedCountry;
    if (disabled || !country) return;
    if (guessedNames?.has(country.name)) {
      setError("Already guessed.");
      return;
    }
    onGuess(country);
    setValue("");
    setSelected(null);
    setError(null);
  };

  return (
    // flexGrow: 1 so this row actually claims the toolbar's spare width —
    // left at "auto" it shrink-wraps to a size too narrow to fit the
    // button, wrapping it onto its own line even with room to spare. The
    // error text uses flex-basis: 100% to drop to its own line within this
    // same row instead.
    <div style={{ display: "flex", flexGrow: 1, gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
      <Autocomplete
        autoFocus
        placeholder="Guess a country..."
        data={COUNTRY_NAMES}
        value={value}
        onChange={handleChange}
        onOptionSubmit={handleOptionSubmit}
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
        disabled={disabled || !matchedCountry}
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: 800,
          fontSize: 14,
          background: COLORS.accent,
          color: COLORS.surface,
          border: `1px solid ${COLORS.accent}`,
          padding: "10px 22px",
          cursor: disabled || !matchedCountry ? "default" : "pointer",
          opacity: disabled || !matchedCountry ? 0.45 : 1,
        }}
      >
        Guess
      </button>
      {error && (
        <span
          style={{ flexBasis: "100%", fontSize: 12, color: COLORS.accentHover, fontFamily: FONT_FAMILY }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
