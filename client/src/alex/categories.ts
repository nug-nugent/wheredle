import type { GuessFeedback, Tertile, TileFlag } from "./engine";

export const TERTILE_LABEL: Record<Tertile, string> = {
  bottom: "Bottom third",
  middle: "Middle third",
  top: "Top third",
};

export interface CategoryDef {
  key: string;
  header: string;
  flag: (f: GuessFeedback) => TileFlag;
  label: (f: GuessFeedback) => string;
}

// Single source of truth for the tile categories: both the guess list and
// the confirmed rail read from this. Language isn't here — a country can
// speak several languages with a meaningful "family" partial match between
// them, so it gets its own chip list rather than a single tile. Currency
// can also be multi-valued, but with no partial-credit tier worth showing,
// so it stays a plain tile like continent or government.
export const CATEGORIES: CategoryDef[] = [
  {
    key: "continent",
    header: "Continent",
    flag: (f) => (f.sameContinent ? "correct" : "wrong"),
    label: (f) => f.country.continent,
  },
  {
    key: "population",
    header: "Population",
    flag: (f) => f.populationDirection,
    label: (f) => TERTILE_LABEL[f.populationTertile],
  },
  {
    key: "area",
    header: "Land Area",
    flag: (f) => f.areaDirection,
    label: (f) => TERTILE_LABEL[f.areaTertile],
  },
  {
    key: "nameLength",
    header: "Name Length",
    flag: (f) => f.nameLengthDirection,
    label: (f) => TERTILE_LABEL[f.nameLengthTertile],
  },
  {
    key: "flagColours",
    header: "Flag Colours",
    flag: (f) => f.flagColorDirection,
    label: (f) => String(f.country.flagColorCount),
  },
  {
    key: "borders",
    header: "Borders",
    flag: (f) => f.borderDirection,
    label: (f) => String(f.country.borderCount),
  },
  {
    key: "religion",
    header: "Religion",
    flag: (f) => (f.sameReligion ? "correct" : "wrong"),
    label: (f) => f.country.religion ?? "No majority",
  },
  {
    key: "government",
    header: "Government",
    flag: (f) => (f.sameGovernmentType ? "correct" : "wrong"),
    label: (f) => f.country.governmentType ?? "Unknown",
  },
  {
    key: "currency",
    header: "Currency",
    flag: (f) => (f.sameCurrency ? "correct" : "wrong"),
    label: (f) => f.country.currencies.join(", ") || "Unknown",
  },
];

export interface ConfirmedFact {
  key: string;
  header: string;
  label: string;
}

export function getConfirmedFacts(guesses: GuessFeedback[]): ConfirmedFact[] {
  const facts: ConfirmedFact[] = [];

  for (const category of CATEGORIES) {
    const matched = guesses.find((f) => category.flag(f) === "correct");
    if (matched) facts.push({ key: category.key, header: category.header, label: category.label(matched) });
  }

  const languageMatch = guesses.find((f) => f.languageChips.some((c) => c.state === "correct"));
  if (languageMatch) {
    facts.push({
      key: "language",
      header: "Language",
      label: languageMatch.languageChips
        .filter((c) => c.state === "correct")
        .map((c) => c.name)
        .join(", "),
    });
  }

  return facts;
}
