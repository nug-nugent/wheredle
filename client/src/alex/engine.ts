import { countries, type Country } from "../data/country";
import { bestLanguageMatch, type LanguageMatch } from "./languageFamily";

// Population, land area, and name length are bucketed into thirds by rank
// (not raw value), so "top third" has a fixed meaning regardless of how
// skewed the numbers are. Flag colour count and border count are small,
// human-countable integers, so those compare by exact value instead.
export type Tertile = "bottom" | "middle" | "top";

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

export interface GuessFeedback {
  country: Country;
  correct: boolean;
  sameContinent: boolean;
  populationTertile: Tertile;
  samePopulationTertile: boolean;
  areaTertile: Tertile;
  sameAreaTertile: boolean;
  nameLengthTertile: Tertile;
  sameNameLengthTertile: boolean;
  sameFlagColorCount: boolean;
  sameBorderCount: boolean;
  sameReligion: boolean;
  sameGovernmentType: boolean;
  sameCurrency: boolean;
  languageMatch: LanguageMatch;
}

export interface AlexGameState {
  target: Country;
  guesses: GuessFeedback[];
  status: "playing" | "won";
}

export function pickRandomCountry(): Country {
  return countries[Math.floor(Math.random() * countries.length)];
}

export function startAlexGame(target: Country): AlexGameState {
  return { target, guesses: [], status: "playing" };
}

// Split from the old submitAlexGuess so the UI can compute a guess's result
// and hold it back for the reveal ceremony before it's added to game state.
export function computeGuessFeedback(state: AlexGameState, guessed: Country): GuessFeedback {
  return {
    country: guessed,
    correct: guessed.cca3 === state.target.cca3,
    sameContinent: guessed.continent === state.target.continent,
    populationTertile: populationTertileOf(guessed),
    samePopulationTertile: populationTertileOf(guessed) === populationTertileOf(state.target),
    areaTertile: areaTertileOf(guessed),
    sameAreaTertile: areaTertileOf(guessed) === areaTertileOf(state.target),
    nameLengthTertile: nameLengthTertileOf(guessed),
    sameNameLengthTertile: nameLengthTertileOf(guessed) === nameLengthTertileOf(state.target),
    sameFlagColorCount: guessed.flagColorCount === state.target.flagColorCount,
    sameBorderCount: guessed.borderCount === state.target.borderCount,
    sameReligion: guessed.religion === state.target.religion,
    sameGovernmentType: guessed.governmentType === state.target.governmentType,
    sameCurrency:
      guessed.currencies.length > 0 &&
      guessed.currencies.some((c) => state.target.currencies.includes(c)),
    languageMatch: bestLanguageMatch(guessed.languages, state.target.languages),
  };
}

export function applyGuessFeedback(state: AlexGameState, feedback: GuessFeedback): AlexGameState {
  if (state.status !== "playing") return state;
  if (state.guesses.some((g) => g.country.cca3 === feedback.country.cca3)) return state;

  return {
    ...state,
    guesses: [feedback, ...state.guesses],
    status: feedback.correct ? "won" : "playing",
  };
}
