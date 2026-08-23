// The day model behind every daily puzzle: what "today" is, and the
// deterministic dice both modes roll from it. Nothing here touches game
// content — it's the shared arithmetic that lets two players on opposite
// sides of the world open the same board without a server telling them what
// it is.

// Day 0 of the puzzle sequence. Fixed forever: moving it renumbers every
// puzzle that has ever been played and shifts what each day's board was.
export const EPOCH = new Date(2026, 7, 23);

const MS_PER_DAY = 86_400_000;

function localMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Whole days since EPOCH, rolling over at **local** midnight — a player's
// day starts when their day starts, which is friendlier than a UTC cutover
// landing mid-evening for some of them. The cost is that two players in
// different timezones are briefly on different puzzles; comparing scores
// across that gap is what the puzzle number in a shared result is for.
//
// Rounding rather than flooring the division is what absorbs daylight saving:
// both ends are local midnights, so a DST boundary between them leaves the
// difference an hour off a whole number of days rather than a day short.
//
// Clamped at zero so a clock set before EPOCH still gets a playable board
// rather than a negative index into everything downstream.
export function dayNumber(now: Date = new Date()): number {
  const days = Math.round((localMidnight(now).getTime() - EPOCH.getTime()) / MS_PER_DAY);
  return Math.max(0, days);
}

// The day as players see it, counting from one. Only ever for display — a
// shared result quoting "#42" is what makes two grids comparable.
export function puzzleNumber(day: number): number {
  return day + 1;
}

// Until the next local midnight, for a "come back tomorrow" countdown.
export function msUntilNextDay(now: Date = new Date()): number {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getTime() - now.getTime();
}

// FNV-1a, 32-bit. Any stable string hash would do; what matters is that it's
// the same everywhere and never changes, since every board in the game's
// history is derived from it.
export function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// A seeded PRNG (mulberry32) for the incidental randomness inside a puzzle —
// which letter a clue reveals, where a flag segment is cropped. Those have to
// come out the same for everyone playing a given day, or two players get
// different difficulty and their shared grids stop meaning the same thing.
export function rng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Order a list by hashing each item's own stable key against the seed. This
// is the selection idiom the whole daily system uses, in preference to a
// seeded shuffle, because both lists it ranks are expected to change:
// countries.json is regenerated from upstream sources, and the category list
// will grow.
//
// A shuffle derives every position from the list as a whole, so one added
// item reshuffles every day that has ever been drawn. Here each item's score
// depends only on itself and the seed, so an addition slots into the existing
// order and leaves every other item's score untouched — for a draw that takes
// the top N, that means at most one incumbent is displaced.
//
// The key must be a stable identifier (a country's cca3, a category's key),
// never an array index, or the property is lost. Ties break on the key itself
// rather than falling through to input order, so the result doesn't depend on
// how the list happens to be arranged.
export function rankByHash<T>(items: T[], seed: string, keyOf: (item: T) => string): T[] {
  return items
    .map((item) => ({ item, key: keyOf(item), score: hash(`${seed}:${keyOf(item)}`) }))
    .sort((a, b) => a.score - b.score || a.key.localeCompare(b.key))
    .map((scored) => scored.item);
}
