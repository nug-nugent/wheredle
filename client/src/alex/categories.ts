import type { Country } from "../data/country";
import type { GuessFeedback, Tertile, TileFlag } from "./engine";
import { AREA_TERTILE_RANGES, NAME_LENGTH_TERTILE_RANGES, POPULATION_TERTILE_RANGES } from "./engine";

export const TERTILE_LABEL: Record<Tertile, string> = {
  bottom: "Bottom third",
  middle: "Middle third",
  top: "Top third",
};

function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function formatRange(tertile: Tertile, ranges: Record<Tertile, [number, number]>, formatter: (n: number) => string): string {
  const [min, max] = ranges[tertile];
  return min === max ? formatter(min) : `${formatter(min)}–${formatter(max)}`;
}

export interface CategoryDef {
  key: string;
  header: string;
  flag: (f: GuessFeedback) => TileFlag;
  label: (f: GuessFeedback) => string;
  // Only set for categories with an orderable raw value (population, area,
  // name length, flag colours, borders). An "up"/"down" guess against one of
  // these pins the target between/above/below real numbers, which the
  // "Remaining mysteries" rail turns into a bound like "borders < 5".
  getValue?: (c: Country) => number;
  formatBound?: (n: number) => string;
  unit?: string;
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
    getValue: (c) => c.population,
    formatBound: formatCompactNumber,
  },
  {
    key: "area",
    header: "Land Area",
    flag: (f) => f.areaDirection,
    label: (f) => TERTILE_LABEL[f.areaTertile],
    getValue: (c) => c.area,
    formatBound: formatCompactNumber,
    unit: "km²",
  },
  {
    key: "nameLength",
    header: "Name Length",
    flag: (f) => f.nameLengthDirection,
    label: (f) => TERTILE_LABEL[f.nameLengthTertile],
    getValue: (c) => c.name.length,
    formatBound: String,
    unit: "letters",
  },
  {
    key: "flagColours",
    header: "Flag Colours",
    flag: (f) => f.flagColorDirection,
    label: (f) => String(f.country.flagColorCount),
    getValue: (c) => c.flagColorCount,
    formatBound: String,
  },
  {
    key: "borders",
    header: "Borders",
    flag: (f) => f.borderDirection,
    label: (f) => String(f.country.borderCount),
    getValue: (c) => c.borderCount,
    formatBound: String,
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

// Categories whose tertile match can be pinned down to a concrete numeric
// range, so the confirmed rail can say "6-7 letters" rather than just
// repeating "Top third".
const CONFIRMED_RANGE_LABEL: Partial<Record<string, (f: GuessFeedback) => string>> = {
  population: (f) => formatRange(f.populationTertile, POPULATION_TERTILE_RANGES, formatCompactNumber),
  area: (f) => `${formatRange(f.areaTertile, AREA_TERTILE_RANGES, formatCompactNumber)} km²`,
  nameLength: (f) => `${formatRange(f.nameLengthTertile, NAME_LENGTH_TERTILE_RANGES, String)} letters`,
};

export function getConfirmedFacts(guesses: GuessFeedback[]): ConfirmedFact[] {
  const facts: ConfirmedFact[] = [];

  for (const category of CATEGORIES) {
    const matched = guesses.find((f) => category.flag(f) === "correct");
    if (!matched) continue;
    const rangeLabel = CONFIRMED_RANGE_LABEL[category.key];
    facts.push({
      key: category.key,
      header: category.header,
      label: rangeLabel ? rangeLabel(matched) : category.label(matched),
    });
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

// For a category that isn't confirmed yet, "up"/"down" guesses each pin the
// target above or below a real number — the tightest of those (highest
// "up" floor, lowest "down" ceiling) is the narrowest range we can state
// with certainty, e.g. "< 5" once a 5-border guess has come back "down".
export function getRemainingMysteries(guesses: GuessFeedback[]): ConfirmedFact[] {
  const confirmedKeys = new Set(getConfirmedFacts(guesses).map((f) => f.key));
  const mysteries: ConfirmedFact[] = [];

  for (const category of CATEGORIES) {
    if (confirmedKeys.has(category.key) || !category.getValue || !category.formatBound) continue;

    let floor: number | undefined;
    let ceiling: number | undefined;
    for (const g of guesses) {
      const value = category.getValue(g.country);
      const dir = category.flag(g);
      if (dir === "up") floor = floor === undefined ? value : Math.max(floor, value);
      else if (dir === "down") ceiling = ceiling === undefined ? value : Math.min(ceiling, value);
    }
    if (floor === undefined && ceiling === undefined) continue;

    const bound = category.formatBound;
    const range =
      floor !== undefined && ceiling !== undefined
        ? `${bound(floor)}–${bound(ceiling)}`
        : floor !== undefined
          ? `> ${bound(floor)}`
          : `< ${bound(ceiling!)}`;

    mysteries.push({ key: category.key, header: category.header, label: category.unit ? `${range} ${category.unit}` : range });
  }

  return mysteries;
}
