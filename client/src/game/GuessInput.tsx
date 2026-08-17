import { useState } from "react";
import { Autocomplete, Button, Group } from "@mantine/core";
import { countries, type Country } from "../data/country";

const DIACRITIC_MARKS = /[̀-ͯ]/g;

function normalize(value: string): string {
  return value.normalize("NFD").replace(DIACRITIC_MARKS, "").toLowerCase().trim();
}

const MIN_SEARCH_LENGTH = 3;

const NAMES = countries.map((c) => c.name);
const BY_NORMALIZED_NAME = new Map(countries.map((c) => [normalize(c.name), c]));

export function GuessInput({
  onGuess,
  guessedNames,
}: {
  onGuess: (country: Country) => void;
  guessedNames?: ReadonlySet<string>;
}) {
  const [value, setValue] = useState("");

  const matched = BY_NORMALIZED_NAME.get(normalize(value));
  const alreadyGuessed = matched ? (guessedNames?.has(matched.name) ?? false) : false;

  const submit = () => {
    if (!matched || alreadyGuessed) return;
    onGuess(matched);
    setValue("");
  };

  return (
    <Group gap="sm">
      <Autocomplete
        placeholder="Guess a country..."
        data={NAMES}
        value={value}
        onChange={setValue}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        filter={({ options, search }) => {
          if (search.trim().length < MIN_SEARCH_LENGTH) return [];
          const query = normalize(search);
          return options.filter(
            (option) =>
              "label" in option &&
              normalize(option.label).includes(query) &&
              !guessedNames?.has(option.label)
          );
        }}
        error={alreadyGuessed ? "Already guessed" : undefined}
        w={280}
      />
      <Button onClick={submit} disabled={!matched || alreadyGuessed}>
        Guess
      </Button>
    </Group>
  );
}
