import { countries, type Country } from "../data/country";
import { languageLineage } from "./languageFamily";

// Population, land area, and name length are bucketed into thirds by rank
// (not raw value), so "top third" has a fixed meaning regardless of how
// skewed the numbers are. Flag colour count and border count are small,
// human-countable integers, so those compare by exact value instead.
export type Tertile = "bottom" | "middle" | "top";

// A tile's visual state: "correct" is an exact match, "wrong" is an
// unrelated miss, and "up"/"down" point toward the target for the
// categories where "closer" has a direction (population, area, name
// length, flag colours, borders).
export type TileFlag = "correct" | "wrong" | "up" | "down";

export interface CurrencyChip {
  name: string;
  correct: boolean;
}

export type LanguageChipState = "correct" | "family" | "wrong";
export interface LanguageChip {
  name: string;
  state: LanguageChipState;
}

function buildTertileClassifier(getValue: (c: Country) => number): (c: Country) => Tertile {
  const sorted = [...countries].sort((a, b) => getValue(a) - getValue(b));
  const tertileSize = Math.ceil(sorted.length / 3);
  const byCca3 = new Map<string, Tertile>(
    sorted.map((c, i) => [
      c.cca3,
      i < tertileSize ? "bottom" : i < tertileSize * 2 ? "middle" : "top",
    ])
  );
  return (country) => {
    const tertile = byCca3.get(country.cca3);
    if (!tertile) throw new Error(`No tertile for ${country.cca3}`);
    return tertile;
  };
}

const populationTertileOf = buildTertileClassifier((c) => c.population);
const areaTertileOf = buildTertileClassifier((c) => c.area);
const nameLengthTertileOf = buildTertileClassifier((c) => c.name.length);

// "up" means the target's value is higher than the guess (dial it up);
// "down" means the reverse. Only meaningful once we know it's not correct.
function direction(guessedValue: number, targetValue: number, correct: boolean): TileFlag {
  if (correct) return "correct";
  return guessedValue < targetValue ? "up" : "down";
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
  currencyChips: CurrencyChip[];
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
    populationDirection: direction(guessed.population, target.population, samePopulationTertile),
    areaTertile: areaTertileOf(guessed),
    sameAreaTertile,
    areaDirection: direction(guessed.area, target.area, sameAreaTertile),
    nameLengthTertile: nameLengthTertileOf(guessed),
    sameNameLengthTertile,
    nameLengthDirection: direction(guessed.name.length, target.name.length, sameNameLengthTertile),
    sameFlagColorCount,
    flagColorDirection: direction(guessed.flagColorCount, target.flagColorCount, sameFlagColorCount),
    sameBorderCount,
    borderDirection: direction(guessed.borderCount, target.borderCount, sameBorderCount),
    sameReligion: guessed.religion === target.religion,
    sameGovernmentType: guessed.governmentType === target.governmentType,
    currencyChips: guessed.currencies.map((name) => ({
      name,
      correct: target.currencies.includes(name),
    })),
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
