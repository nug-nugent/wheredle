import { countries, type Country } from "../data/country";
import { languageLineage } from "./languageFamily";

// Population, land area, and name length are bucketed into thirds by rank
// (not raw value), so "top third" has a fixed meaning regardless of how
// skewed the numbers are. Flag colour count and border count are small,
// human-countable integers, so those compare by exact value instead.
export type Tertile = "bottom" | "middle" | "top";

// A tile's visual state: "correct" is an exact match, "wrong" is an
// unrelated miss, and "up"/"down" point toward the target for the
// categories with an exact-value comparison (flag colours, borders).
// Population, area, and name length only ever produce "correct"/"wrong",
// since their "correct" is a coarser tertile match rather than exact
// equality — see tertileFlag in this file.
export type TileFlag = "correct" | "wrong" | "up" | "down";

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
  const tertileSize = Math.ceil(sorted.length / 3);
  const byCca3 = new Map<string, Tertile>();
  const buckets: Record<Tertile, number[]> = { bottom: [], middle: [], top: [] };
  sorted.forEach((c, i) => {
    const tertile: Tertile = i < tertileSize ? "bottom" : i < tertileSize * 2 ? "middle" : "top";
    byCca3.set(c.cca3, tertile);
    buckets[tertile].push(getValue(c));
  });
  const ranges = {
    bottom: [Math.min(...buckets.bottom), Math.max(...buckets.bottom)],
    middle: [Math.min(...buckets.middle), Math.max(...buckets.middle)],
    top: [Math.min(...buckets.top), Math.max(...buckets.top)],
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

const populationTertileOf = populationTertiles.classify;
const areaTertileOf = areaTertiles.classify;
const nameLengthTertileOf = nameLengthTertiles.classify;

export const POPULATION_TERTILE_RANGES = populationTertiles.ranges;
export const AREA_TERTILE_RANGES = areaTertiles.ranges;
export const NAME_LENGTH_TERTILE_RANGES = nameLengthTertiles.ranges;

// "up" means the target's value is higher than the guess (dial it up);
// "down" means the reverse. Only meaningful once we know it's not correct.
// Only used for flag colours and borders, where "correct" is exact equality
// — so revealing which side of the guessed value the target sits on is a
// proportionate hint. Population, area, and name length use tertile buckets
// instead (see tertileFlag below): a wrong guess there only rules out the
// guessed country's own tertile, which doesn't always resolve to a single
// direction (ruling out the middle tertile leaves a gap on both sides), so
// those categories don't get an up/down hint at all.
function direction(guessedValue: number, targetValue: number, correct: boolean): TileFlag {
  if (correct) return "correct";
  return guessedValue < targetValue ? "up" : "down";
}

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
  sameFlagColorCount: boolean;
  flagColorDirection: TileFlag;
  sameBorderCount: boolean;
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
  const sameFlagColorCount = guessed.flagColorCount === target.flagColorCount;
  const sameBorderCount = guessed.borderCount === target.borderCount;

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
    sameFlagColorCount,
    flagColorDirection: direction(guessed.flagColorCount, target.flagColorCount, sameFlagColorCount),
    sameBorderCount,
    borderDirection: direction(guessed.borderCount, target.borderCount, sameBorderCount),
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
