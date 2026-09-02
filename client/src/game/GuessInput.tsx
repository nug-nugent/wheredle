import { useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete } from "@mantine/core";
import type { Country } from "../data/country";
import { COLORS, FONT_FAMILY } from "../theme";
import { findCountryByName, searchCountries } from "./countryMatch";

interface CountryOption {
  value: string;
  label: string;
  alias: string | null;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Typing the next guess is always the player's next move, so the caret
  // belongs here rather than wherever the last one left it: on the Guess
  // button after a click, or nowhere at all in Alex mode, where the input is
  // disabled for the reveal and drops focus to the body when it goes.
  //
  // Focus is only taken back when nothing else has claimed it, since the
  // reveal runs long enough for the player to have opened the info or stats
  // modal in the meantime, and an input that yanks the caret out from under
  // a dialog is worse than one that waits.
  const focusInput = () => {
    const active = document.activeElement;
    if (active && active !== document.body && !rootRef.current?.contains(active)) return;
    inputRef.current?.focus();
  };

  // Fires on mount — the start of a game, or the return from a clue choice —
  // and again each time a reveal hands the input back.
  useEffect(() => {
    if (!disabled) focusInput();
  }, [disabled]);

  const options: CountryOption[] = useMemo(
    () =>
      searchCountries(value)
        .filter((match) => !guessedNames?.has(match.country.name))
        .map((match) => ({ value: match.country.name, label: match.country.name, alias: match.alias })),
    [value, guessedNames]
  );

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
  // back to a whole-name (or whole-alias) match against the typed value.
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
    focusInput();
  };

  return (
    // flexGrow: 1 so this row actually claims the toolbar's spare width —
    // left at "auto" it shrink-wraps to a size too narrow to fit the
    // button, wrapping it onto its own line even with room to spare. The
    // error text uses flex-basis: 100% to drop to its own line within this
    // same row instead.
    <div
      ref={rootRef}
      style={{ display: "flex", flexGrow: 1, gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}
    >
      <Autocomplete
        ref={inputRef}
        placeholder="Guess a country..."
        data={options}
        value={value}
        onChange={handleChange}
        onOptionSubmit={handleOptionSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        // `options` is already the ranked, de-duplicated result set; the
        // default filter would drop the fuzzy and alias hits, since neither
        // contains what was typed.
        filter={({ options }) => options}
        renderOption={({ option }) => {
          const alias = (option as CountryOption).alias;
          return (
            <span>
              {option.value}
              {alias && <span style={{ opacity: 0.55 }}> - {alias}</span>}
            </span>
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
          option: { fontFamily: FONT_FAMILY, fontSize: 14 },
        }}
        // Wrapping is decided on the flex basis rather than the shrunk
        // width, so a basis wide enough to look right on desktop is what
        // pushed the button onto its own line on a phone. 150 keeps the
        // two on one row down to 320px and grows back out above that.
        style={{ flex: "1 1 150px", maxWidth: 460 }}
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
          padding: "10px 20px",
          minHeight: 40,
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
