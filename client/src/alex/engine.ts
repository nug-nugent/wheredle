import { countries, type Country } from "../data/country";
import { languageLineage } from "./languageFamily";

// Every numeric category (population, land area, name length, border count)
// is bucketed into thirds by rank (not raw value), so "top third" has a
// fixed meaning regardless of how skewed the numbers are. Borders is a
// small, human-countable integer with lots of ties (e.g. 27 countries have
// exactly 3 land borders) — bucketing it the same way as population avoids
// an exact-match comparison implying a direction ("< 5 borders") from a
// single guess, which read as an unfair overreveal.
export type Tertile = "bottom" | "middle" | "top";

// A tile's visual state: "correct" is a same-tertile match, "wrong" is an
// unrelated miss — see tertileFlag in this file.
export type TileFlag = "correct" | "wrong";

export type LanguageChipState = "correct" | "family" | "wrong";
export interface LanguageChip {
  name: string;
  state: LanguageChipState;
}

// The min/max raw value found within each tertile bucket, so the UI can
// tell the player "6-7 letters" instead of just "top third".
export type TertileRanges = Record<Tertile, [number, number]>;

function buildTertileClassifier(
  getValue: (c: Country) => number
): { classify: (c: Country) => Tertile; ranges: TertileRanges } {
  const sorted = [...countries].sort((a, b) => getValue(a) - getValue(b));

  // Group countries that share a value before cutting into thirds, so a
  // cut point never lands inside a tie. Splitting a tie would put the same
  // raw value in two adjacent buckets' displayed ranges (e.g. bottom "0-2"
  // and middle "2-4" both containing 2 for border count) — confusing even
  // though the classification itself is still correct. This trades exactly
  // equal thirds for boundaries that never overlap.
  const groups: { value: number; countries: Country[] }[] = [];
  for (const c of sorted) {
    const value = getValue(c);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.value === value) lastGroup.countries.push(c);
    else groups.push({ value, countries: [c] });
  }

  const n = sorted.length;
  const boundaryTargets = [n / 3, (2 * n) / 3];
  const buckets: Record<Tertile, Country[]> = { bottom: [], middle: [], top: [] };
  const order: Tertile[] = ["bottom", "middle", "top"];
  let cumulative = 0;
  let tertileIndex = 0;
  for (const group of groups) {
    while (tertileIndex < boundaryTargets.length) {
      const target = boundaryTargets[tertileIndex];
      const distanceIfKept = Math.abs(cumulative - target);
      const distanceIfMoved = Math.abs(cumulative + group.countries.length - target);
      if (distanceIfMoved >= distanceIfKept) tertileIndex++;
      else break;
    }
    buckets[order[tertileIndex]].push(...group.countries);
    cumulative += group.countries.length;
  }

  const byCca3 = new Map<string, Tertile>();
  for (const tertile of order) {
    for (const c of buckets[tertile]) byCca3.set(c.cca3, tertile);
  }
  const ranges = {
    bottom: [Math.min(...buckets.bottom.map(getValue)), Math.max(...buckets.bottom.map(getValue))],
    middle: [Math.min(...buckets.middle.map(getValue)), Math.max(...buckets.middle.map(getValue))],
    top: [Math.min(...buckets.top.map(getValue)), Math.max(...buckets.top.map(getValue))],
  } as TertileRanges;
  return {
    classify: (country) => {
      const tertile = byCca3.get(country.cca3);
      if (!tertile) throw new Error(`No tertile for ${country.cca3}`);
      return tertile;
    },
    ranges,
  };
}

const populationTertiles = buildTertileClassifier((c) => c.population);
const areaTertiles = buildTertileClassifier((c) => c.area);
const nameLengthTertiles = buildTertileClassifier((c) => c.name.length);
const borderTertiles = buildTertileClassifier((c) => c.borderCount);

const populationTertileOf = populationTertiles.classify;
const areaTertileOf = areaTertiles.classify;
const nameLengthTertileOf = nameLengthTertiles.classify;
const borderTertileOf = borderTertiles.classify;

export const POPULATION_TERTILE_RANGES = populationTertiles.ranges;
export const AREA_TERTILE_RANGES = areaTertiles.ranges;
export const NAME_LENGTH_TERTILE_RANGES = nameLengthTertiles.ranges;
export const BORDER_TERTILE_RANGES = borderTertiles.ranges;

// A wrong guess only rules out the guessed country's own tertile — it
// doesn't say which side of it the target is on. That's deliberate: ruling
// out the middle tertile alone doesn't resolve to a single direction (the
// target could be above or below it), so no category gets a directional
// hint from a single guess. See tertileMysteryLabel in categories.ts for how
// the "Remaining mysteries" rail narrows this down across guesses instead.
function tertileFlag(sameTertile: boolean): TileFlag {
  return sameTertile ? "correct" : "wrong";
}

// "family" is a broader match than our usual lineage-depth comparison:
// just whether the guessed language's broadest ancestor (lineage[0])
// matches any of the target's — enough to colour a chip, not to rank it.
function languageChipState(guessedLanguage: string, targetLanguages: string[]): LanguageChipState {
  if (targetLanguages.includes(guessedLanguage)) return "correct";

  const guessedLineage = languageLineage(guessedLanguage);
  if (guessedLineage) {
    for (const target of targetLanguages) {
      const targetLineage = languageLineage(target);
      if (targetLineage && targetLineage[0] === guessedLineage[0]) return "family";
    }
  }
  return "wrong";
}

export interface GuessFeedback {
  country: Country;
  correct: boolean;
  sameContinent: boolean;
  populationTertile: Tertile;
  samePopulationTertile: boolean;
  populationDirection: TileFlag;
  areaTertile: Tertile;
  sameAreaTertile: boolean;
  areaDirection: TileFlag;
  nameLengthTertile: Tertile;
  sameNameLengthTertile: boolean;
  nameLengthDirection: TileFlag;
  borderTertile: Tertile;
  sameBorderTertile: boolean;
  borderDirection: TileFlag;
  sameReligion: boolean;
  sameGovernmentType: boolean;
  // Currency is treated as a single-valued attribute, like continent or
  // government: correct if any of the guessed country's currencies is also
  // one of the target's. Multi-currency countries are rare enough (a dozen
  // or so in the dataset) that this doesn't need per-currency chip credit
  // the way language does.
  sameCurrency: boolean;
  languageChips: LanguageChip[];
}

export const MAX_GUESSES = 6;

export interface AlexGameState {
  target: Country;
  guesses: GuessFeedback[];
  status: "playing" | "won" | "lost";
}

export function pickRandomCountry(): Country {
  return countries[Math.floor(Math.random() * countries.length)];
}

export function startAlexGame(target: Country): AlexGameState {
  return { target, guesses: [], status: "playing" };
}

export function computeGuessFeedback(state: AlexGameState, guessed: Country): GuessFeedback {
  const target = state.target;
  const samePopulationTertile = populationTertileOf(guessed) === populationTertileOf(target);
  const sameAreaTertile = areaTertileOf(guessed) === areaTertileOf(target);
  const sameNameLengthTertile = nameLengthTertileOf(guessed) === nameLengthTertileOf(target);
  const sameBorderTertile = borderTertileOf(guessed) === borderTertileOf(target);

  return {
    country: guessed,
    correct: guessed.cca3 === target.cca3,
    sameContinent: guessed.continent === target.continent,
    populationTertile: populationTertileOf(guessed),
    samePopulationTertile,
    populationDirection: tertileFlag(samePopulationTertile),
    areaTertile: areaTertileOf(guessed),
    sameAreaTertile,
    areaDirection: tertileFlag(sameAreaTertile),
    nameLengthTertile: nameLengthTertileOf(guessed),
    sameNameLengthTertile,
    nameLengthDirection: tertileFlag(sameNameLengthTertile),
    borderTertile: borderTertileOf(guessed),
    sameBorderTertile,
    borderDirection: tertileFlag(sameBorderTertile),
    sameReligion: guessed.religion === target.religion,
    sameGovernmentType: guessed.governmentType === target.governmentType,
    sameCurrency:
      guessed.currencies.length > 0 &&
      guessed.currencies.some((c) => target.currencies.includes(c)),
    languageChips: guessed.languages.map((name) => ({
      name,
      state: languageChipState(name, target.languages),
    })),
  };
}

export function applyGuessFeedback(state: AlexGameState, feedback: GuessFeedback): AlexGameState {
  if (state.status !== "playing") return state;
  if (state.guesses.some((g) => g.country.cca3 === feedback.country.cca3)) return state;

  const guesses = [feedback, ...state.guesses];
  const status = feedback.correct ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "playing";
  return { ...state, guesses, status };
}
