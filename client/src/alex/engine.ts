import { countries, letterCount, populationDensity, type Country } from "../data/country";
import { languageLineage, sharedLineageDepth } from "./languageFamily";

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

// How a category scored one guess, for the per-guess summary behind both
// the history row's dots and the share grid's emoji. Wider than TileFlag
// because a category can carry a halfway state — language does, matching a
// family without naming the language outright — even though the categories
// that render as tiles never use it.
export type SquareState = TileFlag | "partial";

// How a guess scored on a multi-valued attribute: it holds precisely the
// target's values, some of them, or none. Climate is the only one. The
// three-way split matters because scoring a shared value as a plain hit made
// a fully green row mean less than players read it as meaning — a country
// that is only tropical scores green against one that is tropical and
// temperate, so every column could match without the guess being the answer.
export type SetMatch = "exact" | "shared" | "none";

function setMatch(guessed: string[], target: string[]): SetMatch {
  if (!guessed.some((v) => target.includes(v))) return "none";
  // Both lists are duplicate-free and drawn from the same domain, so equal
  // length plus containment is set equality.
  const identical = guessed.length === target.length && guessed.every((v) => target.includes(v));
  return identical ? "exact" : "shared";
}

export type LanguageChipState = "correct" | "family" | "wrong";
export interface LanguageChip {
  name: string;
  // Broadest family down to the language itself; empty for a language the
  // taxonomy doesn't cover, which can still match exactly by name.
  lineage: string[];
  // How many levels of `lineage` are shared with the closest of the
  // target's languages: 0 for no relation at all, lineage.length when the
  // target speaks this language too. This is what separates a sibling
  // branch from a root five millennia back — `state` alone can't, since
  // both are merely "family".
  sharedDepth: number;
  // The narrowest family shared with the target, i.e. lineage[sharedDepth - 1].
  // Undefined when nothing is shared.
  sharedAncestor?: string;
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
const nameLengthTertiles = buildTertileClassifier((c) => letterCount(c.name));
const borderTertiles = buildTertileClassifier((c) => c.borderCount);
const hdiTertiles = buildTertileClassifier((c) => c.hdi);
const densityTertiles = buildTertileClassifier(populationDensity);

const populationTertileOf = populationTertiles.classify;
const areaTertileOf = areaTertiles.classify;
const nameLengthTertileOf = nameLengthTertiles.classify;
const borderTertileOf = borderTertiles.classify;
const hdiTertileOf = hdiTertiles.classify;
const densityTertileOf = densityTertiles.classify;

export const POPULATION_TERTILE_RANGES = populationTertiles.ranges;
export const AREA_TERTILE_RANGES = areaTertiles.ranges;
export const NAME_LENGTH_TERTILE_RANGES = nameLengthTertiles.ranges;
export const BORDER_TERTILE_RANGES = borderTertiles.ranges;
export const HDI_TERTILE_RANGES = hdiTertiles.ranges;
export const DENSITY_TERTILE_RANGES = densityTertiles.ranges;

// A wrong guess only rules out the guessed country's own tertile — it
// doesn't say which side of it the target is on. That's deliberate: ruling
// out the middle tertile alone doesn't resolve to a single direction (the
// target could be above or below it), so no category gets a directional
// hint from a single guess. See tertileMysteryLabel in categories.ts for how
// the "Remaining mysteries" rail narrows this down across guesses instead.
function tertileFlag(sameTertile: boolean): TileFlag {
  return sameTertile ? "correct" : "wrong";
}

// One guessed language measured against every language the target speaks,
// keeping the closest relationship found. "family" means any shared
// ancestry at all — the same threshold as before — but the chip now also
// carries how deep that sharing runs, so the UI can rank near misses
// instead of painting Dutch and Hindi identically against an English
// target.
function languageChip(guessedLanguage: string, targetLanguages: string[]): LanguageChip {
  const lineage = languageLineage(guessedLanguage) ?? [];

  let sharedDepth = 0;
  for (const target of targetLanguages) {
    sharedDepth = Math.max(sharedDepth, sharedLineageDepth(guessedLanguage, target));
  }

  // Name equality is the source of truth for an exact match, not the
  // taxonomy: a language missing from the table still matches itself.
  const exact = targetLanguages.includes(guessedLanguage);

  return {
    name: guessedLanguage,
    lineage,
    sharedDepth,
    sharedAncestor: sharedDepth > 0 ? lineage[sharedDepth - 1] : undefined,
    state: exact ? "correct" : sharedDepth > 0 ? "family" : "wrong",
  };
}

// PERSISTED, inside AlexGameState. Every field here is derived from a target
// and a guessed country, so useAlexGame's resume() recomputes the lot rather
// than reading it back — which is what stops a change to this type breaking
// games saved by the previous build, as splitting sameClimate into
// climateMatch once did. See the save contract in CLAUDE.md.
export interface GuessFeedback {
  country: Country;
  correct: boolean;
  sameContinent: boolean;
  populationTertile: Tertile;
  samePopulationTertile: boolean;
  // Exact equality, not just same tertile — lets the Confirmed rail show a
  // precise value instead of the tertile's full range on the rare occasion
  // a guess happens to share the target's exact number (common for name
  // length and border count, which have few possible values and lots of
  // ties; astronomically unlikely for population/area, but harmless to
  // check the same way).
  samePopulationValue: boolean;
  populationDirection: TileFlag;
  areaTertile: Tertile;
  sameAreaTertile: boolean;
  sameAreaValue: boolean;
  areaDirection: TileFlag;
  nameLengthTertile: Tertile;
  sameNameLengthTertile: boolean;
  sameNameLengthValue: boolean;
  nameLengthDirection: TileFlag;
  borderTertile: Tertile;
  sameBorderTertile: boolean;
  sameBorderCount: boolean;
  borderDirection: TileFlag;
  hdiTertile: Tertile;
  sameHdiTertile: boolean;
  sameHdiValue: boolean;
  hdiDirection: TileFlag;
  densityTertile: Tertile;
  sameDensityTertile: boolean;
  sameDensityValue: boolean;
  densityDirection: TileFlag;
  sameReligion: boolean;
  sameGovernmentType: boolean;
  // Exact when the two countries have precisely the same zones, shared when
  // they merely overlap. A shared hit doesn't say *which* zone was shared —
  // a guess spanning four of them proves only that one of the four is the
  // target's — so the narrowing it's worth gets worked out across the whole
  // guess list; see the climate category in categories.ts.
  climateMatch: SetMatch;
  languageChips: LanguageChip[];
}

export const MAX_GUESSES = 6;

// PERSISTED — this is the blob itself. `categoryKeys` is the field a rebuild
// can't recover, since nothing else records which board a game was dealt, so
// renaming a category key silently drops that column from every game in
// progress. That's the kind of change GAME_VERSION is still for.
export interface AlexGameState {
  target: Country;
  // The categories this board was drawn with, stored rather than recomputed
  // so a deploy that adds or removes one can't rearrange a game in progress,
  // and a finished result still says what it was scored against.
  categoryKeys: string[];
  guesses: GuessFeedback[];
  status: "playing" | "won" | "lost";
}

export function startAlexGame(target: Country, categoryKeys: string[]): AlexGameState {
  return { target, categoryKeys, guesses: [], status: "playing" };
}

// Takes the target rather than the game state: what a guess scores depends
// only on the country it's measured against, which is what lets the daily
// draw work out what a board can tell apart before there's a game at all.
export function computeGuessFeedback(target: Country, guessed: Country): GuessFeedback {
  const samePopulationTertile = populationTertileOf(guessed) === populationTertileOf(target);
  const sameAreaTertile = areaTertileOf(guessed) === areaTertileOf(target);
  const sameNameLengthTertile = nameLengthTertileOf(guessed) === nameLengthTertileOf(target);
  const sameBorderTertile = borderTertileOf(guessed) === borderTertileOf(target);
  const sameHdiTertile = hdiTertileOf(guessed) === hdiTertileOf(target);
  const sameDensityTertile = densityTertileOf(guessed) === densityTertileOf(target);

  return {
    country: guessed,
    correct: guessed.cca3 === target.cca3,
    sameContinent: guessed.continent === target.continent,
    populationTertile: populationTertileOf(guessed),
    samePopulationTertile,
    samePopulationValue: guessed.population === target.population,
    populationDirection: tertileFlag(samePopulationTertile),
    areaTertile: areaTertileOf(guessed),
    sameAreaTertile,
    sameAreaValue: guessed.area === target.area,
    areaDirection: tertileFlag(sameAreaTertile),
    nameLengthTertile: nameLengthTertileOf(guessed),
    sameNameLengthTertile,
    sameNameLengthValue: letterCount(guessed.name) === letterCount(target.name),
    nameLengthDirection: tertileFlag(sameNameLengthTertile),
    borderTertile: borderTertileOf(guessed),
    sameBorderTertile,
    sameBorderCount: guessed.borderCount === target.borderCount,
    borderDirection: tertileFlag(sameBorderTertile),
    hdiTertile: hdiTertileOf(guessed),
    sameHdiTertile,
    sameHdiValue: guessed.hdi === target.hdi,
    hdiDirection: tertileFlag(sameHdiTertile),
    densityTertile: densityTertileOf(guessed),
    sameDensityTertile,
    sameDensityValue: populationDensity(guessed) === populationDensity(target),
    densityDirection: tertileFlag(sameDensityTertile),
    sameReligion: guessed.religion === target.religion,
    sameGovernmentType: guessed.governmentType === target.governmentType,
    climateMatch: setMatch(guessed.climateZones, target.climateZones),
    languageChips: guessed.languages.map((name) => languageChip(name, target.languages)),
  };
}

export function applyGuessFeedback(state: AlexGameState, feedback: GuessFeedback): AlexGameState {
  if (state.status !== "playing") return state;
  if (state.guesses.some((g) => g.country.cca3 === feedback.country.cca3)) return state;

  const guesses = [feedback, ...state.guesses];
  const status = feedback.correct ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "playing";
  return { ...state, guesses, status };
}
