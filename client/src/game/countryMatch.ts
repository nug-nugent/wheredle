import { countries, type Country } from "../data/country";
import { COUNTRY_ALIASES } from "./countryAliases";

const DIACRITIC_MARKS = /[̀-ͯ]/g;
// Apostrophes and full stops join the letters either side ("Côte d'Ivoire" and
// "U.S.A." read as one word each); every other separator becomes a space.
const JOINING_PUNCTUATION = /['’.]/g;
const SEPARATORS = /[^a-z0-9]+/g;

export function normalizeCountryName(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITIC_MARKS, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(JOINING_PUNCTUATION, "")
    .replace(SEPARATORS, " ")
    .trim()
    .replace(/^the /, "");
}

// Spacing is the one difference people are least consistent about ("Timor
// Leste", "cote d ivoire", "Guinea Bissau"), so comparisons run on a form
// with the spaces taken back out.
const compact = (value: string) => normalizeCountryName(value).replace(/ /g, "");

export const MIN_SEARCH_LENGTH = 3;
export const MAX_SEARCH_RESULTS = 8;

interface Term {
  /** The alias as written, or null when this term is the country's own name. */
  alias: string | null;
  compact: string;
  words: string[];
}

interface Entry {
  country: Country;
  terms: Term[];
}

const toTerm = (text: string, alias: string | null): Term => ({
  alias,
  compact: compact(text),
  words: normalizeCountryName(text).split(" "),
});

const ENTRIES: Entry[] = countries.map((country) => ({
  country,
  terms: [
    toTerm(country.name, null),
    ...(COUNTRY_ALIASES[country.name] ?? []).map((alias) => toTerm(alias, alias)),
  ],
}));

const BY_NAME = new Map(ENTRIES.map((e) => [e.terms[0].compact, e.country]));
const BY_ALIAS = new Map<string, Country[]>();
for (const entry of ENTRIES) {
  for (const term of entry.terms.slice(1)) {
    const existing = BY_ALIAS.get(term.compact);
    if (existing) existing.push(entry.country);
    else BY_ALIAS.set(term.compact, [entry.country]);
  }
}

if (import.meta.env?.DEV) {
  const orphans = Object.keys(COUNTRY_ALIASES).filter((name) => !BY_NAME.has(compact(name)));
  if (orphans.length > 0) {
    console.warn(`countryAliases.ts: no country named ${orphans.join(", ")} — aliases ignored`);
  }
}

/**
 * Resolve a typed name to a country, for committing a guess without opening
 * the dropdown. Deliberately strict: only a whole name or a whole alias
 * counts, so a half-typed name can never be submitted as a guess. An alias
 * shared by two countries resolves to neither — the player picks from the
 * dropdown instead.
 */
export function findCountryByName(value: string): Country | undefined {
  const key = compact(value);
  const byName = BY_NAME.get(key);
  if (byName) return byName;
  const byAlias = BY_ALIAS.get(key);
  return byAlias?.length === 1 ? byAlias[0] : undefined;
}

/**
 * Cheapest way to edit `query` into any *prefix* of `candidate`, capped at
 * `max` (anything above returns max + 1). Free trailing characters are what
 * makes a half-typed name score as well as a complete one; transpositions
 * count as one edit so "Untied States" stays close to "United States".
 */
function prefixEditDistance(query: string, candidate: string, max: number): number {
  const rows = candidate.length + 1;
  // Row 0: an empty query costs one insertion per candidate letter. Only the
  // final row is read as a minimum, so it's the trailing letters that come
  // free, not any letters the candidate happens to start with.
  let twoBack: number[] = [];
  let previous: number[] = Array.from({ length: rows }, (_, j) => j);
  for (let i = 1; i <= query.length; i++) {
    const current = new Array<number>(rows);
    current[0] = i;
    let best = i;
    for (let j = 1; j < rows; j++) {
      const substitution = previous[j - 1] + (query[i - 1] === candidate[j - 1] ? 0 : 1);
      let cost = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
      if (
        i > 1 &&
        j > 1 &&
        query[i - 1] === candidate[j - 2] &&
        query[i - 2] === candidate[j - 1]
      ) {
        cost = Math.min(cost, twoBack[j - 2] + 1);
      }
      current[j] = cost;
      if (cost < best) best = cost;
    }
    if (best > max) return max + 1;
    twoBack = previous;
    previous = current;
  }
  return Math.min(...previous);
}

// Lower is better. Names outrank their aliases at every tier, so an exact
// alias ("Holland") still loses to the country actually called that.
const EXACT = 0;
const STARTS_WITH = 2;
const WORD_STARTS_WITH = 4;
const CONTAINS = 6;
const FUZZY = 8;
const NO_MATCH = Infinity;

function scoreTerm(term: Term, query: string, maxDistance: number): number {
  const aliasPenalty = term.alias === null ? 0 : 1;
  if (term.compact === query) return EXACT + aliasPenalty;
  if (term.compact.startsWith(query)) return STARTS_WITH + aliasPenalty;
  if (term.words.length > 1 && term.words.some((word) => word.startsWith(query))) {
    return WORD_STARTS_WITH + aliasPenalty;
  }
  if (term.compact.includes(query)) return CONTAINS + aliasPenalty;

  let distance = prefixEditDistance(query, term.compact, maxDistance);
  if (distance > maxDistance && term.words.length > 1) {
    // "zeland" is nowhere near a prefix of "newzealand" but is one letter off
    // "zealand", so words get their own shot at matching.
    for (const word of term.words) {
      distance = Math.min(distance, prefixEditDistance(query, word, maxDistance));
    }
  }
  if (distance > maxDistance) return NO_MATCH;
  return FUZZY + (distance - 1) * 2 + aliasPenalty;
}

export interface CountryMatch {
  country: Country;
  /** Set when the query matched an alias rather than the country's own name. */
  alias: string | null;
}

/**
 * Rank countries against what the player has typed: whole-name and
 * whole-alias matches first, then prefixes, then substrings, then names a
 * typo or two away.
 */
export function searchCountries(search: string, limit = MAX_SEARCH_RESULTS): CountryMatch[] {
  const query = compact(search);
  if (query.length === 0) return [];
  // Below the search length only whole-word matches are offered, so that the
  // short aliases ("UK", "US") still turn up an option to click, without two
  // letters dragging in a third of the world.
  const exactOnly = query.length < MIN_SEARCH_LENGTH;
  const maxDistance = query.length > 5 ? 2 : 1;

  const scored: { match: CountryMatch; score: number }[] = [];
  for (const entry of ENTRIES) {
    let score = NO_MATCH;
    let alias: string | null = null;
    for (const term of entry.terms) {
      const termScore = exactOnly
        ? term.compact === query
          ? EXACT + (term.alias === null ? 0 : 1)
          : NO_MATCH
        : scoreTerm(term, query, maxDistance);
      if (termScore < score) {
        score = termScore;
        alias = term.alias;
      }
    }
    if (score !== NO_MATCH) scored.push({ match: { country: entry.country, alias }, score });
  }

  // Typo-tolerant matches are a fallback, not an addition: once anything has
  // actually matched what was typed, "Cuba" has no business sitting under
  // "United States" for a search of "USA".
  const solid = scored.filter((s) => s.score < FUZZY);
  const pool = solid.length > 0 ? solid : scored;

  pool.sort(
    (a, b) =>
      a.score - b.score ||
      a.match.country.name.length - b.match.country.name.length ||
      a.match.country.name.localeCompare(b.match.country.name)
  );
  return pool.slice(0, limit).map((s) => s.match);
}
