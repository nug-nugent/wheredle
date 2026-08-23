import { countries, type Country } from "./data/country";
import { rankByHash } from "./daily";

// The country a given mode is asking about on a given day.
//
// The sequence is a permutation of the pool rather than an independent draw
// per day, so a country can't come up twice in a fortnight; it regenerates
// each time the sequence wraps, so the second year through isn't a rerun of
// the first. `mode` salts the two games apart — playing /alex mustn't hand
// you the answer to /.
//
// `pool` is every country by default. /alex passes a narrowed one, since a
// country its board can never single out doesn't make a fair daily answer.
//
// Regenerating countries.json shifts this: a country added or dropped changes
// both the ranking and where the sequence wraps, so days after the change can
// land on a different answer than they would have. Games already played are
// unaffected — they store the country they were about — and the alternative,
// a hand-frozen order list, would have to be maintained against a dataset
// that's deliberately generated.
export function dailyTarget(mode: string, day: number, pool: Country[] = countries): Country {
  const cycle = Math.floor(day / pool.length);
  const ranked = rankByHash(pool, `${mode}:targets:${cycle}`, (c) => c.cca3);
  return ranked[day % pool.length];
}

export function randomCountry(pool: Country[] = countries): Country {
  return pool[Math.floor(Math.random() * pool.length)];
}
