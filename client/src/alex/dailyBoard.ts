import { countries, type Country } from "../data/country";
import { rankByHash } from "../daily";
import { CATEGORIES, type CategoryDef } from "./categories";
import { computeGuessFeedback } from "./engine";

// How many of the day's categories are drawn rather than fixed. Six columns
// total once the "always" pair is added — enough to reason with, few enough
// that the board stays readable without the Confirmed rail having to carry
// most of it.
export const ROTATING_SLOTS = 4;

// At most this many of the drawn categories may be tertile ones. Without a
// cap, a straight draw regularly comes out all-numeric: four higher/lower
// columns, which with the fixed name length makes five of six the same kind
// of question, and plays nothing like a day of religion, government and
// language. The cap holds a day to three numeric columns at worst.
const MAX_ROTATING_TERTILES = 2;

// How many boards a day will try before giving up and showing everything.
//
// Not merely a safety net: a target with few workable boards can exhaust
// this even though one exists. Nicaragua is the tightest case in the current
// data, singled out by only 3 of the ~50 legal draws — at 24 attempts its
// day missed all three and fell back to showing all ten categories, which is
// a legible board but a startling one next to every other day's six. 64
// clears it with room to spare, and costs nothing on the days that find a
// board on the first attempt, which is nearly all of them.
const MAX_DRAWS = 64;

// One draw from the rotating pool, in CATEGORIES order rather than draw
// order, so the board reads the same way every day and the chips cell —
// whose expanded lineage ladder takes a line of its own — stays last in the
// row. `attempt` walks a day through alternative draws; see dailyBoard.
function drawBoard(day: number, attempt: number, slots: number): CategoryDef[] {
  const pool = CATEGORIES.filter((c) => c.daily === "rotating");
  const ranked = rankByHash(pool, `alex:categories:${day}#${attempt}`, (c) => c.key);

  const drawn = new Set<CategoryDef>();
  let tertiles = 0;
  for (const category of ranked) {
    if (drawn.size === slots) break;
    if (category.kind === "tertile" && tertiles === MAX_ROTATING_TERTILES) continue;
    drawn.add(category);
    if (category.kind === "tertile") tertiles += 1;
  }

  // Only reachable if the pool ever shrinks to where the cap can't be met.
  // Filling from the same ranking keeps the day deterministic rather than
  // short-changing it.
  for (const category of ranked) {
    if (drawn.size === slots) break;
    drawn.add(category);
  }

  return CATEGORIES.filter((c) => c.daily === "always" || drawn.has(c));
}

// Every country's own values across all categories, worked out once. The
// feedback here is only a vehicle for reading them: what a category says
// about the guessed country doesn't depend on what it's measured against, so
// any country will do as the thing it's measured against.
const PROFILES = new Map<string, Map<string, string>>(
  countries.map((country) => {
    const feedback = computeGuessFeedback(countries[0], country);
    return [country.cca3, new Map(CATEGORIES.map((c) => [c.key, c.value(feedback)]))];
  })
);

// What a board can see of a country. Two countries with the same fingerprint
// score identically against every guess that could ever be made, so no amount
// of play separates them — the board simply cannot ask the question that
// tells them apart.
function fingerprint(country: Country, categories: CategoryDef[]): string {
  const values = PROFILES.get(country.cca3)!;
  // JSON rather than a joined string: no separator character could be
  // trusted not to turn up inside a country's own language list.
  return JSON.stringify(categories.map((c) => values.get(c.key)));
}

function singlesOut(target: Country, categories: CategoryDef[]): boolean {
  const wanted = fingerprint(target, categories);
  return !countries.some((c) => c.cca3 !== target.cca3 && fingerprint(c, categories) === wanted);
}

// Countries that can serve as a daily answer. A pared-down board only shows
// six of ten categories, and plenty of them collapse whole regions into one
// indistinguishable clump — so the board is drawn to fit the answer rather
// than the other way round, walking alternative draws until one can single
// the target out.
//
// A country the *full* set can't separate from another is beyond rescue: if
// no category distinguishes them, no selection of categories will either.
// Twelve countries are in that position, and they're dropped from the daily
// pool rather than set as answers nobody could find. They still appear as
// guesses, and in practice games.
//
// They come in look-alike pairs and clusters: Benin and Togo, Mali and
// Niger, and eight Caribbean and Atlantic island states. Retiring the
// currency category cost two of these — it was a poor column to play
// against, but a currency held by exactly one country did occasionally tell
// two otherwise identical neighbours apart.
export const DAILY_TARGET_POOL: Country[] = (() => {
  const seen = new Map<string, number>();
  for (const country of countries) {
    const fp = fingerprint(country, CATEGORIES);
    seen.set(fp, (seen.get(fp) ?? 0) + 1);
  }
  return countries.filter((country) => seen.get(fingerprint(country, CATEGORIES)) === 1);
})();

// The board for a day, drawn to suit that day's answer.
export function dailyBoard(day: number, target: Country, slots: number = ROTATING_SLOTS): CategoryDef[] {
  for (let attempt = 0; attempt < MAX_DRAWS; attempt++) {
    const board = drawBoard(day, attempt, slots);
    if (singlesOut(target, board)) return board;
  }

  // Unreachable for a target from DAILY_TARGET_POOL. Showing everything is
  // the safe way to be wrong: a cluttered board beats an unanswerable one.
  return CATEGORIES;
}

// The board a stored game was played on, so a deploy that adds or removes a
// category can't rearrange one already in progress.
export function categoriesFromKeys(keys: string[]): CategoryDef[] {
  return CATEGORIES.filter((c) => keys.includes(c.key));
}
