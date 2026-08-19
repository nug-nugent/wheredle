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
  // Only set for the exact-value categories (flag colours, borders). An
  // "up"/"down" guess against one of these pins the target above/below a
  // real number, which the "Remaining mysteries" rail turns into a bound
  // like "borders < 5".
  getValue?: (c: Country) => number;
  formatBound?: (n: number) => string;
  unit?: string;
  // Only set for the tertile-bucketed categories (population, area, name
  // length). These never produce "up"/"down" — a wrong guess only rules out
  // the guessed country's own tertile, which the "Remaining mysteries" rail
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

const TERTILE_ORDER: Tertile[] = ["bottom", "middle", "top"];

// For a tertile-bucketed category, a wrong guess only rules out the guessed
// country's own tertile — it doesn't say which side of it the target is on.
// Ruling out the bottom or top tertile leaves a single-sided bound (the
// remaining two tertiles are contiguous), but ruling out the middle tertile
// leaves a gap on both sides, so the bound has to be stated as an "or".
function tertileMysteryLabel(category: CategoryDef, guesses: GuessFeedback[]): string | undefined {
  if (!category.tertile) return undefined;
  const { of, ranges } = category.tertile;
  const bound = category.formatBound ?? String;

  const eliminated = new Set<Tertile>();
  for (const g of guesses) {
    if (category.flag(g) === "wrong") eliminated.add(of(g));
  }
  const remaining = TERTILE_ORDER.filter((t) => !eliminated.has(t));
  if (remaining.length === 3) return undefined;

  if (remaining.length === 1) return formatRange(remaining[0], ranges, bound);

  const excluded = TERTILE_ORDER.find((t) => eliminated.has(t))!;
  if (excluded === "bottom") return `> ${bound(ranges.bottom[1])}`;
  if (excluded === "top") return `< ${bound(ranges.top[0])}`;
  return `< ${bound(ranges.middle[0])} or > ${bound(ranges.middle[1])}`;
}

// For an exact-value category, "up"/"down" guesses each pin the target
// above or below a real number — the tightest of those (highest "up"
// floor, lowest "down" ceiling) is the narrowest range we can state with
// certainty, e.g. "< 5" once a 5-border guess has come back "down".
function exactValueMysteryLabel(category: CategoryDef, guesses: GuessFeedback[]): string | undefined {
  if (!category.getValue || !category.formatBound) return undefined;
  const getValue = category.getValue;
  const bound = category.formatBound;

  let floor: number | undefined;
  let ceiling: number | undefined;
  for (const g of guesses) {
    const value = getValue(g.country);
    const dir = category.flag(g);
    if (dir === "up") floor = floor === undefined ? value : Math.max(floor, value);
    else if (dir === "down") ceiling = ceiling === undefined ? value : Math.min(ceiling, value);
  }
  if (floor === undefined && ceiling === undefined) return undefined;

  return floor !== undefined && ceiling !== undefined
    ? `${bound(floor)}–${bound(ceiling)}`
    : floor !== undefined
      ? `> ${bound(floor)}`
      : `< ${bound(ceiling!)}`;
}

export function getRemainingMysteries(guesses: GuessFeedback[]): ConfirmedFact[] {
  const confirmedKeys = new Set(getConfirmedFacts(guesses).map((f) => f.key));
  const mysteries: ConfirmedFact[] = [];

  for (const category of CATEGORIES) {
    if (confirmedKeys.has(category.key)) continue;

    const range = tertileMysteryLabel(category, guesses) ?? exactValueMysteryLabel(category, guesses);
    if (range === undefined) continue;

    mysteries.push({ key: category.key, header: category.header, label: category.unit ? `${range} ${category.unit}` : range });
  }

  return mysteries;
}
