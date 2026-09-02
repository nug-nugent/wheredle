import { CLIMATE_ZONES, CLIMATE_ZONE_LABEL, letterCount, type Country } from "../data/country";
import type { GuessFeedback, LanguageChip, SetMatch, SquareState, Tertile, TertileRanges } from "./engine";
import {
  AREA_TERTILE_RANGES,
  BORDER_TERTILE_RANGES,
  HDI_TERTILE_RANGES,
  NAME_LENGTH_TERTILE_RANGES,
  POPULATION_TERTILE_RANGES,
} from "./engine";

function formatHdi(n: number): string {
  return n.toFixed(3);
}

export const TERTILE_LABEL: Record<Tertile, string> = {
  bottom: "Bottom third",
  middle: "Middle third",
  top: "Top third",
};

function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function formatRange(tertile: Tertile, ranges: TertileRanges, formatter: (n: number) => string): string {
  const [min, max] = ranges[tertile];
  return min === max ? formatter(min) : `${formatter(min)}–${formatter(max)}`;
}

function withUnit(unit: string | undefined, value: string): string {
  return unit ? `${value} ${unit}` : value;
}

// "is" — a positive fact about the target, whether matched outright or
// deduced. "isnt" — a value or range ruled out. Both are certainties: every
// piece of feedback in this game is a hard constraint, so the split is about
// positive vs negative knowledge, never about confidence.
export type FactKind = "is" | "isnt";

export interface KnownFact {
  key: string;
  header: string;
  label: string;
  kind: FactKind;
}

// Whether a category is on every board or drawn for the day. Which of the
// rotating ones a given day gets is decided by the daily seeding, not here —
// this is only the eligibility flag.
export type DailySlot = "always" | "rotating";

// The shape of information a category carries, so a day's draw can be kept
// from coming out all-numeric. Not a rendering concern: "tertile" and "flat"
// both draw as tiles.
export type CategoryKind = "tertile" | "flat" | "language";

interface CategoryCommon {
  key: string;
  header: string;
  daily: DailySlot;
  kind: CategoryKind;
  // Everything this category contributes to the knowledge rail, derived from
  // the whole guess list rather than one matching guess: a tertile can be
  // pinned down by elimination across several wrong guesses, and languages
  // accumulate confirmations the same way. Returns a list because one
  // category can establish more than one fact — language yields both the
  // confirmed languages and the deepest family reached.
  facts: (guesses: GuessFeedback[]) => KnownFact[];
  // What this category says about the guessed country on its own, with no
  // target in the picture — the value a tile would show, or the whole set a
  // chip list would. Two countries agreeing on this for every category of a
  // board score identically against every guess anyone could make, so the
  // board can never tell them apart; the daily draw uses that to avoid
  // setting a puzzle with no findable answer.
  value: (f: GuessFeedback) => string;
}

// Single source of truth for a category: how it scores a guess, how it
// draws, and what it contributes to the rail. Discriminated on how it fills
// its slot in a guess — one tile with a value, or a list of chips — which is
// what lets the grid draw every category from this list alone instead of
// special-casing language beside it.
export type CategoryDef =
  | (CategoryCommon & {
      cell: "tile";
      // A tile is usually a hit or a miss, but a set category can come
      // out halfway — see setCategory — so this is the full state.
      square: (f: GuessFeedback) => SquareState;
      label: (f: GuessFeedback) => string;
      // A second, subordinate line, for a label that can't stand on its own.
      // Only the tertile categories set it: every other tile names something
      // concrete about the guessed country — "Asia", "Republic", "Arid" —
      // while "Top third" names a bucket without saying where it starts or
      // ends. See tertileCategory for why the string it returns has to match
      // the rail's wording exactly, and why it drops away on the guesses
      // whose main label is already exact.
      detail?: (f: GuessFeedback) => string | undefined;
    })
  | (CategoryCommon & {
      cell: "chips";
      square: (f: GuessFeedback) => SquareState;
    });

const TERTILE_ORDER: Tertile[] = ["bottom", "middle", "top"];

// Exactly the target's values is a hit, some of them is the halfway
// amber, none of them is a miss.
const SET_MATCH_SQUARE: Record<SetMatch, SquareState> = {
  exact: "correct",
  shared: "partial",
  none: "wrong",
};

// A category whose values bucket into thirds. A wrong guess rules out the
// guessed country's own tertile, so one eliminated tertile becomes an
// exclusion and two become a certainty — the survivor *is* the target's,
// since a guess is flagged wrong precisely when its tertile differs. That's
// why it joins the positives rather than being hedged into a tier of its own.
function tertileCategory(config: {
  key: string;
  header: string;
  daily: DailySlot;
  square: (f: GuessFeedback) => SquareState;
  of: (f: GuessFeedback) => Tertile;
  ranges: TertileRanges;
  formatBound: (n: number) => string;
  unit?: string;
  // The target's exact value, on the rare occasion a guess pins it outright
  // rather than merely landing in the same third; null when this guess
  // doesn't. Lets the rail say "6 letters" instead of "6–7 letters".
  exactValue?: (f: GuessFeedback) => number | null;
}): CategoryDef {
  const { key, header, daily, square, of, ranges, formatBound, unit, exactValue } = config;

  const pinnedBy = (f: GuessFeedback): number | null => (exactValue ? exactValue(f) : null);

  return {
    key,
    header,
    daily,
    kind: "tertile",
    cell: "tile",
    square,
    // A guess that happens to hold the target's exact value says so — "6
    // letters", not "Bottom third". It's the same fact stated precisely, and
    // it's already what the rail says, so hiding it behind the bucket would
    // have the two disagree about how much the player knows.
    label: (f) => {
      const pinned = pinnedBy(f);
      return pinned !== null ? withUnit(unit, formatBound(pinned)) : TERTILE_LABEL[of(f)];
    },
    // Deliberately built the same way as the rail's range, by the same
    // helpers and with the same unit: the point of showing it here is that
    // the player can see it's the same thing being talked about, which a
    // reworded or reformatted version would undo. It goes away entirely once
    // the label above is exact — the range exists to say where an unnamed
    // third begins, and there's no unnamed third left to place.
    detail: (f) => (pinnedBy(f) !== null ? undefined : withUnit(unit, formatRange(of(f), ranges, formatBound))),
    value: (f) => of(f),
    facts: (guesses) => {
      const matched = guesses.find((g) => square(g) === "correct");
      if (matched) {
        let pinned: number | null = null;
        if (exactValue) {
          for (const g of guesses) {
            const value = exactValue(g);
            if (value !== null) {
              pinned = value;
              break;
            }
          }
        }
        const label = pinned !== null ? formatBound(pinned) : formatRange(of(matched), ranges, formatBound);
        return [{ key, header, label: withUnit(unit, label), kind: "is" }];
      }

      const eliminated = new Set<Tertile>();
      for (const g of guesses) {
        if (square(g) === "wrong") eliminated.add(of(g));
      }
      const remaining = TERTILE_ORDER.filter((t) => !eliminated.has(t));

      if (remaining.length === 1) {
        return [{ key, header, label: withUnit(unit, formatRange(remaining[0], ranges, formatBound)), kind: "is" }];
      }
      if (eliminated.size > 0) {
        const ruledOut = TERTILE_ORDER.filter((t) => eliminated.has(t)).map((t) => formatRange(t, ranges, formatBound));
        return [{ key, header, label: withUnit(unit, `not ${ruledOut.join(", ")}`), kind: "isnt" }];
      }
      return [];
    },
  };
}

// A category with a flat set of values, matched outright or not at all.
// `excluded` is only worth setting where the domain is small enough that an
// exclusion actually narrows the field: continent (5 values), religion (7),
// government (23). Currency leaves it unset — its domain runs to hundreds of
// values, most of them held by a single country, so "not Kenyan shilling"
// says no more than the guess list already does while growing without bound.
function flatCategory(config: {
  key: string;
  header: string;
  daily: DailySlot;
  match: (f: GuessFeedback) => boolean;
  label: (f: GuessFeedback) => string;
  // Returns [] where the guessed country has no value to rule out, so a null
  // religion doesn't surface as "not No majority".
  excluded?: (f: GuessFeedback) => string[];
}): CategoryDef {
  const { key, header, daily, match, label, excluded } = config;

  return {
    key,
    header,
    daily,
    kind: "flat",
    cell: "tile",
    square: (f) => (match(f) ? "correct" : "wrong"),
    label,
    value: label,
    facts: (guesses) => {
      const matched = guesses.find(match);
      if (matched) return [{ key, header, label: label(matched), kind: "is" }];
      if (!excluded) return [];

      // Reaching here means no guess matched, so every guess is a miss whose
      // value can be ruled out.
      const ruledOut: string[] = [];
      for (const g of guesses) {
        for (const value of excluded(g)) {
          if (!ruledOut.includes(value)) ruledOut.push(value);
        }
      }
      return ruledOut.length > 0 ? [{ key, header, label: `not ${ruledOut.join(", ")}`, kind: "isnt" }] : [];
    },
  };
}

// A category whose value is a *set*. Climate is the only one — most
// countries have a single zone, but the large and varied ones honestly span
// several, and calling China temperate to make it fit a single tile would
// put a falsehood on a board where every tile is a hard fact.
//
// It scores three ways rather than two, which is what separates it from a
// flatCategory. Green means the guess holds *precisely* the target's zones;
// amber means it shares at least one without matching the set; red means it
// shares none. Scoring a shared zone green was the original design and it
// was a mistake: a country that is only tropical scored green against one
// that is tropical and temperate, so a guess could light every column on
// the board without being the answer. That tripled how often a fully green
// row meant nothing, and players reasonably read a full row as a win.
//
// What each outcome is worth:
//
//  - Red is strong and simple. Sharing no zone means *every* zone the guess
//    holds is absent from the target, so all of them are ruled out at once —
//    a red on China eliminates four of the five in one move.
//  - Green settles the column outright. The target's zones are exactly the
//    guess's, which leaves nothing further to learn here.
//  - Amber is a disjunction. It says at least one of the guess's zones is
//    the target's without saying which, so on its own it confirms nothing
//    unless the guess had only one zone to offer.
//
// So ambers are read against the exclusions rather than alone: once reds
// have ruled out all but one of an amber's zones, the survivor is certain.
// That's the same reasoning as a tertile pinned down by eliminating the
// other two, and it lands in the same place — among the positives, with no
// hedging.
//
// Ambers are also worth checking one at a time rather than intersected.
// Guessing Iceland (polar) and then Canada (continental and polar) proves
// only what Iceland already did, because Canada's amber is satisfied by the
// polar the target is known to have — it is no evidence about continental
// at all. Every amber that *does* collapse to one zone contributes it, so
// confirmed zones accumulate across the guess list the way languages do.
function setCategory(config: {
  key: string;
  header: string;
  daily: DailySlot;
  // Every value the category can take, in the order they should read. Used
  // to order the rail's lists, and to spot the case where exclusions alone
  // have left exactly one value standing.
  domain: string[];
  of: (country: Country) => string[];
  match: (f: GuessFeedback) => SetMatch;
  label: (value: string) => string;
}): CategoryDef {
  const { key, header, daily, domain, of, match, label } = config;
  const values = (f: GuessFeedback) => of(f.country);
  const inDomainOrder = (vs: string[]) => domain.filter((v) => vs.includes(v));
  const list = (vs: string[]) => inDomainOrder(vs).map(label).join(", ");

  return {
    key,
    header,
    daily,
    // Not a kind of its own: the only thing reading this is the daily
    // draw's cap on numeric columns, and for that purpose a set category
    // counts as flat — it asks the same sort of question religion does.
    kind: "flat",
    cell: "tile",
    square: (f) => SET_MATCH_SQUARE[match(f)],
    label: (f) => list(values(f)),
    // The set itself, which is enough precisely because green means an
    // exact match: guessing any country carrying a given set scores green
    // against that set and nothing else, so two countries with different
    // sets always have some guess that tells them apart. Under the old
    // score-any-overlap-as-green rule this was *not* safe, and using it
    // set an unwinnable puzzle — Nauru held the Australian dollar and
    // Tuvalu the Australian and the Tuvaluan, and since only Tuvalu
    // carried a Tuvaluan dollar, no guess could ever separate them.
    value: (f) => inDomainOrder(values(f)).join("|"),
    facts: (guesses) => {
      const ruledOut: string[] = [];
      for (const g of guesses) {
        if (match(g) !== "none") continue;
        for (const v of values(g)) if (!ruledOut.includes(v)) ruledOut.push(v);
      }

      // An exact match is the whole answer for this column, so it's stated
      // alone: "tropical and temperate" already says the others are out,
      // and listing them beside it would only pad the rail.
      const exact = guesses.find((g) => match(g) === "exact");
      if (exact) {
        return [{ key, header, label: list(values(exact)), kind: "is" }];
      }

      const confirmed: string[] = [];
      const confirm = (v: string) => {
        if (!confirmed.includes(v)) confirmed.push(v);
      };

      // Exclusions alone can settle it: the target always holds at least one
      // value, so if every value but one has been ruled out, that one is the
      // target's whether or not any guess ever scored.
      const standing = domain.filter((v) => !ruledOut.includes(v));
      if (standing.length === 1) confirm(standing[0]);

      for (const g of guesses) {
        if (match(g) !== "shared") continue;
        const possible = values(g).filter((v) => !ruledOut.includes(v));
        if (possible.length === 1) confirm(possible[0]);
      }

      const facts: KnownFact[] = [];
      if (confirmed.length > 0) {
        facts.push({ key, header, label: list(confirmed), kind: "is" });
      }
      // Both facts can stand at once — short of an exact match, knowing one
      // of the target's zones doesn't finish the column — so the exclusion
      // needs a key of its own to sit beside the positive in the rail.
      if (ruledOut.length > 0) {
        facts.push({ key: `${key}Excluded`, header, label: `not ${list(ruledOut)}`, kind: "isnt" });
      }
      return facts;
    },
  };
}

// Language is the one attribute with a halfway state: a guess can share a
// family with something the target speaks without naming it outright. It's
// also multi-valued, so it draws a list of chips rather than a single tile.
// Everything else about it is a category like any other, which is what keeps
// it eligible for a day's draw instead of being bolted on beside the grid.
function languageCategory(): CategoryDef {
  return {
    key: "language",
    header: "Languages",
    daily: "rotating",
    kind: "language",
    cell: "chips",
    square: (f) => {
      if (f.languageChips.some((c) => c.state === "correct")) return "correct";
      if (f.languageChips.some((c) => c.state === "family")) return "partial";
      return "wrong";
    },
    // Sorted, because two countries listing the same languages in a different
    // order are the same country as far as any guess can tell.
    value: (f) => [...f.country.languages].sort().join("|"),
    facts: (guesses) => {
      const facts: KnownFact[] = [];

      // Confirmed languages are gathered across every guess, not just the
      // first one to land a hit: a target speaking both French and German can
      // have them confirmed by two separate guesses.
      const confirmed: string[] = [];
      for (const g of guesses) {
        for (const chip of g.languageChips) {
          if (chip.state === "correct" && !confirmed.includes(chip.name)) confirmed.push(chip.name);
        }
      }
      if (confirmed.length > 0) {
        facts.push({ key: "language", header: "Languages", label: confirmed.join(", "), kind: "is" });
      }

      // The deepest ancestry established without naming a language outright.
      // A partial chip says the target speaks *something* in this branch that
      // hasn't been pinned down yet, which is real, certain narrowing and the
      // one piece of language knowledge that accumulates across guesses
      // without ever appearing above. Exact matches are excluded
      // deliberately: their lineage is fully implied by the Languages fact,
      // so including them would only pad the rail — but a target speaking
      // both French and German still gets "Indo-European → Germanic" from a
      // Dutch guess after French is confirmed, because that points at the
      // language still outstanding.
      let deepest: LanguageChip | undefined;
      for (const g of guesses) {
        for (const chip of g.languageChips) {
          if (chip.state !== "family") continue;
          if (!deepest || chip.sharedDepth > deepest.sharedDepth) deepest = chip;
        }
      }
      if (deepest) {
        facts.push({
          key: "languageFamily",
          header: "Language family",
          label: deepest.lineage.slice(0, deepest.sharedDepth).join(" → "),
          kind: "is",
        });
      }

      return facts;
    },
  };
}

// Currency was one of these and isn't any more. With 146 currencies, 132 of
// them held by a single country, its tile came out red for 97.6% of all
// guesses — and since exclusions were switched off for it (a domain that
// size makes "not the Kenyan shilling" worthless), a miss taught nothing
// either. It was a dead column occupying one of six slots. It survives in
// the end-of-game reveal, which is where a fact that's interesting to read
// but useless to deduce from belongs.
//
// Every category the game knows about. A day's board is drawn from this by
// the daily seeding — the "always" entries plus a pick of the rotating ones
// — so the order here is only the order they draw in, free to change without
// disturbing which categories a given day gets.
export const CATEGORIES: CategoryDef[] = [
  flatCategory({
    key: "continent",
    header: "Continent",
    daily: "always",
    match: (f) => f.sameContinent,
    label: (f) => f.country.continent,
    excluded: (f) => [f.country.continent],
  }),
  setCategory({
    key: "climate",
    header: "Climate",
    daily: "rotating",
    domain: CLIMATE_ZONES,
    of: (country) => country.climateZones,
    match: (f) => f.climateMatch,
    label: (zone) => CLIMATE_ZONE_LABEL[zone] ?? zone,
  }),
  tertileCategory({
    key: "population",
    header: "Population",
    daily: "rotating",
    square: (f) => f.populationDirection,
    of: (f) => f.populationTertile,
    ranges: POPULATION_TERTILE_RANGES,
    formatBound: formatCompactNumber,
    exactValue: (f) => (f.samePopulationValue ? f.country.population : null),
  }),
  tertileCategory({
    key: "area",
    header: "Land Area",
    daily: "rotating",
    square: (f) => f.areaDirection,
    of: (f) => f.areaTertile,
    ranges: AREA_TERTILE_RANGES,
    formatBound: formatCompactNumber,
    unit: "km²",
    exactValue: (f) => (f.sameAreaValue ? f.country.area : null),
  }),
  tertileCategory({
    key: "nameLength",
    header: "Name Length",
    daily: "always",
    square: (f) => f.nameLengthDirection,
    of: (f) => f.nameLengthTertile,
    ranges: NAME_LENGTH_TERTILE_RANGES,
    formatBound: String,
    unit: "letters",
    exactValue: (f) => (f.sameNameLengthValue ? letterCount(f.country.name) : null),
  }),
  tertileCategory({
    key: "borders",
    header: "Borders",
    daily: "rotating",
    square: (f) => f.borderDirection,
    of: (f) => f.borderTertile,
    ranges: BORDER_TERTILE_RANGES,
    formatBound: String,
    exactValue: (f) => (f.sameBorderCount ? f.country.borderCount : null),
  }),
  tertileCategory({
    key: "hdi",
    header: "Human Development Index",
    daily: "rotating",
    square: (f) => f.hdiDirection,
    of: (f) => f.hdiTertile,
    ranges: HDI_TERTILE_RANGES,
    formatBound: formatHdi,
    exactValue: (f) => (f.sameHdiValue ? f.country.hdi : null),
  }),
  flatCategory({
    key: "religion",
    header: "Religion",
    daily: "rotating",
    match: (f) => f.sameReligion,
    label: (f) => f.country.religion ?? "No majority",
    excluded: (f) => (f.country.religion ? [f.country.religion] : []),
  }),
  flatCategory({
    key: "government",
    header: "Government",
    daily: "rotating",
    match: (f) => f.sameGovernmentType,
    label: (f) => f.country.governmentType ?? "Unknown",
    excluded: (f) => (f.country.governmentType ? [f.country.governmentType] : []),
  }),
  languageCategory(),
];

// Everything the player has established, in one list: positives first so the
// rail opens with substance, then exclusions. Note there's no separate
// "narrowed down" tier — a tertile pinned down by eliminating the other two
// carries exactly the same certainty as a direct match, so it joins the
// positives rather than being hedged into a category of its own.
export function getKnownFacts(categories: CategoryDef[], guesses: GuessFeedback[]): KnownFact[] {
  const facts = categories.flatMap((category) => category.facts(guesses));
  return [...facts.filter((f) => f.kind === "is"), ...facts.filter((f) => f.kind === "isnt")];
}
