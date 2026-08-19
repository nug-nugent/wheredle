import type { GuessFeedback, Tertile, TileFlag } from "./engine";
import {
  AREA_TERTILE_RANGES,
  BORDER_TERTILE_RANGES,
  NAME_LENGTH_TERTILE_RANGES,
  POPULATION_TERTILE_RANGES,
} from "./engine";

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
  formatBound?: (n: number) => string;
  unit?: string;
  // Only set for the tertile-bucketed categories (population, area, name
  // length, borders). A wrong guess only rules out the
  // guessed country's own tertile, which the "Remaining mysteries" rail
  // turns into a bound, or a two-sided gap if the eliminated tertile is the
  // middle one (see getRemainingMysteries).
  tertile?: {
    of: (f: GuessFeedback) => Tertile;
    ranges: Record<Tertile, [number, number]>;
  };
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
    formatBound: formatCompactNumber,
    tertile: { of: (f) => f.populationTertile, ranges: POPULATION_TERTILE_RANGES },
  },
  {
    key: "area",
    header: "Land Area",
    flag: (f) => f.areaDirection,
    label: (f) => TERTILE_LABEL[f.areaTertile],
    formatBound: formatCompactNumber,
    unit: "km²",
    tertile: { of: (f) => f.areaTertile, ranges: AREA_TERTILE_RANGES },
  },
  {
    key: "nameLength",
    header: "Name Length",
    flag: (f) => f.nameLengthDirection,
    label: (f) => TERTILE_LABEL[f.nameLengthTertile],
    formatBound: String,
    unit: "letters",
    tertile: { of: (f) => f.nameLengthTertile, ranges: NAME_LENGTH_TERTILE_RANGES },
  },
  {
    key: "borders",
    header: "Borders",
    flag: (f) => f.borderDirection,
    label: (f) => TERTILE_LABEL[f.borderTertile],
    formatBound: String,
    tertile: { of: (f) => f.borderTertile, ranges: BORDER_TERTILE_RANGES },
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
// repeating "Top third" — or, if some correct guess happens to share the
// target's exact value (common for name length and border count, which
// have few possible values and lots of ties), the single precise number
// instead of the range.
const CONFIRMED_LABEL: Partial<Record<string, (matched: GuessFeedback, guesses: GuessFeedback[]) => string>> = {
  population: (matched, guesses) => {
    const exact = guesses.find((f) => f.samePopulationValue);
    return exact
      ? formatCompactNumber(exact.country.population)
      : formatRange(matched.populationTertile, POPULATION_TERTILE_RANGES, formatCompactNumber);
  },
  area: (matched, guesses) => {
    const exact = guesses.find((f) => f.sameAreaValue);
    const value = exact
      ? formatCompactNumber(exact.country.area)
      : formatRange(matched.areaTertile, AREA_TERTILE_RANGES, formatCompactNumber);
    return `${value} km²`;
  },
  nameLength: (matched, guesses) => {
    const exact = guesses.find((f) => f.sameNameLengthValue);
    const value = exact ? String(exact.country.name.length) : formatRange(matched.nameLengthTertile, NAME_LENGTH_TERTILE_RANGES, String);
    return `${value} letters`;
  },
  borders: (matched, guesses) => {
    const exact = guesses.find((f) => f.sameBorderCount);
    return exact ? String(exact.country.borderCount) : formatRange(matched.borderTertile, BORDER_TERTILE_RANGES, String);
  },
};

export function getConfirmedFacts(guesses: GuessFeedback[]): ConfirmedFact[] {
  const facts: ConfirmedFact[] = [];

  for (const category of CATEGORIES) {
    const matched = guesses.find((f) => category.flag(f) === "correct");
    if (!matched) continue;
    const labelFn = CONFIRMED_LABEL[category.key];
    facts.push({
      key: category.key,
      header: category.header,
      label: labelFn ? labelFn(matched, guesses) : category.label(matched),
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

const TERTILE_ORDER: Tertile[] = ["bottom", "middle", "top"];

// For a tertile-bucketed category, a wrong guess only rules out the guessed
// country's own tertile — it doesn't say which side of it the target is on.
// A single wrong guess therefore isn't enough to state a bound: only once
// two of the three tertiles have been eliminated does the third pin the
// target down to a concrete range worth showing.
function tertileMysteryLabel(category: CategoryDef, guesses: GuessFeedback[]): string | undefined {
  if (!category.tertile) return undefined;
  const { of, ranges } = category.tertile;
  const bound = category.formatBound ?? String;

  const eliminated = new Set<Tertile>();
  for (const g of guesses) {
    if (category.flag(g) === "wrong") eliminated.add(of(g));
  }
  const remaining = TERTILE_ORDER.filter((t) => !eliminated.has(t));
  if (remaining.length !== 1) return undefined;

  return formatRange(remaining[0], ranges, bound);
}

export function getRemainingMysteries(guesses: GuessFeedback[]): ConfirmedFact[] {
  const confirmedKeys = new Set(getConfirmedFacts(guesses).map((f) => f.key));
  const mysteries: ConfirmedFact[] = [];

  for (const category of CATEGORIES) {
    if (confirmedKeys.has(category.key)) continue;

    const range = tertileMysteryLabel(category, guesses);
    if (range === undefined) continue;

    mysteries.push({ key: category.key, header: category.header, label: category.unit ? `${range} ${category.unit}` : range });
  }

  return mysteries;
}
