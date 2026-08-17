import type { GuessFeedback, Tertile } from "./engine";

export const TERTILE_LABEL: Record<Tertile, string> = {
  bottom: "Bottom third",
  middle: "Middle third",
  top: "Top third",
};

export interface CategoryDef {
  key: string;
  header: string;
  match: (f: GuessFeedback) => boolean;
  label: (f: GuessFeedback) => string;
}

// Single source of truth for the non-language columns: both the guess table
// and the confirmed-facts panel read from this, so a category disappears
// from the table exactly when it appears in the confirmed panel.
export const CATEGORIES: CategoryDef[] = [
  {
    key: "continent",
    header: "Continent",
    match: (f) => f.sameContinent,
    label: (f) => f.country.continent,
  },
  {
    key: "population",
    header: "Population",
    match: (f) => f.samePopulationTertile,
    label: (f) => TERTILE_LABEL[f.populationTertile],
  },
  {
    key: "area",
    header: "Land Area",
    match: (f) => f.sameAreaTertile,
    label: (f) => TERTILE_LABEL[f.areaTertile],
  },
  {
    key: "nameLength",
    header: "Name Length",
    match: (f) => f.sameNameLengthTertile,
    label: (f) => TERTILE_LABEL[f.nameLengthTertile],
  },
  {
    key: "flagColours",
    header: "Flag Colours",
    match: (f) => f.sameFlagColorCount,
    label: (f) => String(f.country.flagColorCount),
  },
  {
    key: "borders",
    header: "Borders",
    match: (f) => f.sameBorderCount,
    label: (f) => String(f.country.borderCount),
  },
  {
    key: "religion",
    header: "Religion",
    match: (f) => f.sameReligion,
    label: (f) => f.country.religion ?? "No majority",
  },
  {
    key: "government",
    header: "Government",
    match: (f) => f.sameGovernmentType,
    label: (f) => f.country.governmentType ?? "Unknown",
  },
  {
    key: "currency",
    header: "Currency",
    match: (f) => f.sameCurrency,
    label: (f) => f.country.currencies.join(", ") || "Unknown",
  },
];

export function isLanguageConfirmed(f: GuessFeedback): boolean {
  return f.languageMatch.sharedDepth === f.languageMatch.lineage.length;
}

export interface ConfirmedFact {
  key: string;
  header: string;
  label: string;
}

export function getConfirmedFacts(guesses: GuessFeedback[]): ConfirmedFact[] {
  const facts: ConfirmedFact[] = [];

  for (const category of CATEGORIES) {
    const matched = guesses.find((f) => category.match(f));
    if (matched) facts.push({ key: category.key, header: category.header, label: category.label(matched) });
  }

  const languageMatch = guesses.find(isLanguageConfirmed);
  if (languageMatch) {
    facts.push({ key: "language", header: "Language", label: languageMatch.languageMatch.language });
  }

  return facts;
}
