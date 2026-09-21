import {
  CLIMATE_ZONES,
  CLIMATE_ZONE_LABEL,
  letterCount,
  populationDensity,
  type Country,
} from "../data/country";
import type { GuessFeedback, LanguageChip, SetMatch, SquareState, Tertile, TertileRanges } from "./engine";
import {
  AREA_TERTILE_RANGES,
  BORDER_TERTILE_RANGES,
  DENSITY_TERTILE_RANGES,
  HDI_TERTILE_RANGES,
  NAME_LENGTH_TERTILE_RANGES,
  POPULATION_TERTILE_RANGES,
} from "./engine";

function formatHdi(n: number): string {
  return n.toFixed(3);
}

// Density spans four orders of magnitude — Mongolia is about 2 people per
// km², Monaco about 19,000 — so one format suits neither end. Below ten the
// whole value is in the decimal; above it the decimal is noise.
function formatDensity(n: number): string {
  return n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString("en-GB");
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

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

// "not X, not Y" rather than one "not" in front of a list. Repeating the
// word is clumsier to read and worth it anyway: a bare list after a single
// "not" reads as a correction — "not Portuguese, French" lands as "it isn't
// Portuguese, it's French!" — which is the exact opposite of what the rail
// means, and it goes wrong precisely where the values are adjectives, which
// languages, continents and religions all are. Every exclusion in the rail
// comes through here so the categories can't drift apart on it — the tertiles
// included, which hand it a third with its bounds in brackets.
//
// Only the first "not" is capitalised. The label starts a card and reads as a
// sentence, so a leading capital is right there; capitalising every "not" in
// a list would not be.
function notList(values: string[]): string {
  return sentenceCase(values.map((v) => `not ${v}`).join(", "));
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
  //
  // It may under-state what a column can see, and name length now does:
  // it reports its third here while the board scores the exact count, so
  // two countries the fingerprint calls identical may in fact be separable.
  // That's the safe direction — the draw demands more of a board than the
  // board has to give — and it's deliberate, because sharpening it would
  // grow DAILY_TARGET_POOL and reshuffle what most days answer. See
  // DAILY_TARGET_POOL in dailyBoard.ts.
  value: (f: GuessFeedback) => string;
  // What this column measures, in plain English — deliberately the half the
  // rules panel leaves out. HowToPlayPanel already explains how a column is
  // *scored* (thirds by rank, climate's three-way match, what amber means);
  // what nothing in the product said was what an HDI or a density actually
  // is. So this names the measure and stays off the scoring, which would
  // otherwise be stated in two places and drift.
  explain: string;
  // What this particular result means, where the colour alone doesn't say
  // it. Returns lines rather than a string because a tile can have two
  // things to add at once — an HDI tile is both "same third as the answer"
  // and, for the two countries the UNDP doesn't publish, "that third was
  // worked out from an estimate". Empty for the categories whose green and
  // red speak for themselves: continent, religion and government are
  // matched outright or not at all.
  explainState?: (f: GuessFeedback) => string[];
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
  // The guessed country's own figure, whether or not it matched — for the
  // one column that scores amber, where landing in the target's third on a
  // different figure rules that figure out. Name length is the only one;
  // see nameLengthFlag in engine.ts for why it's alone. Leave it unset and
  // the column scores two ways as before and the rail never names a figure.
  guessedValue?: (f: GuessFeedback) => number;
  explain: string;
  // Anything to add about the guessed country's own figure, beyond what
  // landing in a third means. Only HDI has one — see there.
  note?: (f: GuessFeedback) => string | undefined;
}): CategoryDef {
  const { key, header, daily, square, of, ranges, formatBound, unit, exactValue, guessedValue, explain, note } =
    config;

  const pinnedBy = (f: GuessFeedback): number | null => (exactValue ? exactValue(f) : null);

  // The guessed country's own figure, written the way the rail writes every
  // other figure in this column — same formatter, same unit — so "6 letters"
  // ruled out reads as the same kind of thing as "6 letters" confirmed.
  const figure = (f: GuessFeedback): string | undefined =>
    guessedValue ? withUnit(unit, formatBound(guessedValue(f))) : undefined;

  // The rail names the third as well as its bounds. A bare "134–19,150 per
  // km²" is precise and still leaves the player to work out which third
  // they have pinned — which is the one thing the tile beside it says in
  // words. Naming both has the two agree, and makes the rail scannable
  // against a board where every numeric tile reads "Top third".
  //
  // The third leads and the bounds sit in brackets behind it, so a positive
  // and an exclusion are the same sentence with one word between them:
  // "Top third (5–16)" against "Not top third (5–16)".
  const namedRange = (tertile: Tertile): string =>
    `${TERTILE_LABEL[tertile]} (${withUnit(unit, formatRange(tertile, ranges, formatBound))})`;

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
    explain,
    // Green on a bucketed column doesn't mean what green means anywhere
    // else on the board, and that's the one thing worth saying here: it is
    // "the same third", not "the same number", and players read a tick as
    // the latter. Red is worth a line for the opposite reason — it looks
    // like a dead end and is in fact the column's strongest result, since
    // it strikes out a full third of the field in one go. Amber, where a
    // column has one, is the pair of them at once — the third confirmed and
    // one figure inside it gone — so it names the figure it just removed.
    explainState: (f) => {
      const lines: string[] = [];
      const ruledOut = figure(f);
      if (pinnedBy(f) !== null) {
        lines.push("This is the answer's own figure, not just the same third.");
      } else if (square(f) === "partial") {
        lines.push(
          ruledOut
            ? `The answer is in this third too, but it isn't ${ruledOut}.`
            : "The answer is in this third too, but not on this figure."
        );
      } else if (square(f) === "correct") {
        lines.push("The answer is in this third too: the same band, not the same figure.");
      } else {
        lines.push("The answer is in a different third, so this whole third is ruled out.");
      }
      const extra = note?.(f);
      if (extra) lines.push(extra);
      return lines;
    },
    facts: (guesses) => {
      // Amber counts as landing in the target's third — it is the same
      // finding as green, minus the exact figure — so both settle the
      // column's positive.
      const matched = guesses.find((g) => square(g) !== "wrong");
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
        // An exact value stays on its own: it is strictly more than the
        // bucket says, so prefixing "Top third" to it would add back the
        // vaguer statement the precise one replaced. Same reasoning as the
        // tile, whose range detail drops away in exactly this case. It also
        // makes the figures ruled out below redundant — the answer's own
        // number is known, so which other numbers it isn't adds nothing.
        if (pinned !== null) {
          return [{ key, header, label: withUnit(unit, formatBound(pinned)), kind: "is" }];
        }

        const known: KnownFact[] = [{ key, header, label: namedRange(of(matched)), kind: "is" }];

        // Every amber in the column took one figure out of that third. They
        // go out under their own key rather than folded into the positive:
        // the rail sorts positives above exclusions, and "Middle third (7–8
        // letters)" with "Not 7 letters" a few cards down is the shape the
        // rest of the rail already has. Sorted by value rather than by when
        // they were guessed, so a list reads in the order a player would
        // count them.
        const excluded = guessedValue
          ? [...new Set(guesses.filter((g) => square(g) === "partial").map(guessedValue))].sort((a, b) => a - b)
          : [];
        if (excluded.length > 0) {
          const labels = excluded.map((v) => withUnit(unit, formatBound(v)));
          known.push({ key: `${key}:figures`, header, label: notList(labels), kind: "isnt" });
        }
        return known;
      }

      const eliminated = new Set<Tertile>();
      for (const g of guesses) {
        if (square(g) === "wrong") eliminated.add(of(g));
      }
      const remaining = TERTILE_ORDER.filter((t) => !eliminated.has(t));

      if (remaining.length === 1) {
        return [{ key, header, label: namedRange(remaining[0]), kind: "is" }];
      }
      if (eliminated.size > 0) {
        // Exactly what a positive would say, lowercased for the middle of
        // a sentence and handed to notList to negate, so the two cannot
        // drift apart in wording. In practice this only ever names one
        // third: eliminating two leaves a survivor, which the branch above
        // states as a positive instead.
        const ruledOut = TERTILE_ORDER.filter((t) => eliminated.has(t)).map((t) => lowerFirst(namedRange(t)));
        return [{ key, header, label: notList(ruledOut), kind: "isnt" }];
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
  explain: string;
}): CategoryDef {
  const { key, header, daily, match, label, excluded, explain } = config;

  return {
    key,
    header,
    daily,
    kind: "flat",
    cell: "tile",
    square: (f) => (match(f) ? "correct" : "wrong"),
    label,
    value: label,
    explain,
    // No explainState: these match outright or not at all, so the tick and
    // the cross already say everything a line here could. Adding "the answer
    // isn't in Europe" under a red Europe tile would be the popover reading
    // the tile back to the player.
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
      return ruledOut.length > 0 ? [{ key, header, label: notList(ruledOut), kind: "isnt" }] : [];
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
  explain: string;
}): CategoryDef {
  const { key, header, daily, domain, of, match, label, explain } = config;
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
    // Amber is the one tile whose colour doesn't say what it found. Green
    // and red both speak for the whole label — every zone listed is the
    // target's, or none of them is — while amber means somewhere in that
    // list is a hit, and the tile as it stood left the player to work out
    // which without saying it was a disjunction at all.
    //
    // A guess offering a single zone has no disjunction to resolve: that
    // zone is the target's, and since the sets still differ the target holds
    // at least one more. That is the same reading the rail already takes
    // from such a guess — an amber narrowed to one possible zone is
    // confirmed there — so this states it on the tile rather than waiting
    // for the player to find it in the rail. With more than one zone offered
    // it stays a disjunction, and the honest phrasing is the weak one: at
    // least one, with no claim about the rest, since a guess whose zones are
    // a subset of the target's shares all of them and still scores amber.
    detail: (f) => {
      if (match(f) !== "shared") return undefined;
      return values(f).length === 1 ? "Answer has this, plus more" : "Answer has at least one of these";
    },
    // The set itself, which is enough precisely because green means an
    // exact match: guessing any country carrying a given set scores green
    // against that set and nothing else, so two countries with different
    // sets always have some guess that tells them apart. Under the old
    // score-any-overlap-as-green rule this was *not* safe, and using it
    // set an unwinnable puzzle — Nauru held the Australian dollar and
    // Tuvalu the Australian and the Tuvaluan, and since only Tuvalu
    // carried a Tuvaluan dollar, no guess could ever separate them.
    value: (f) => inDomainOrder(values(f)).join("|"),
    explain,
    // The tile's `detail` already carries the amber disjunction, since that
    // is the one a player has to act on mid-guess and shouldn't have to open
    // anything to read. This restates it and adds the two the tile stays
    // quiet about: green here is an exact set match rather than an overlap,
    // which is the distinction the whole category exists for, and red is the
    // board's single most productive result.
    explainState: (f) => {
      const zones = values(f).length;
      switch (match(f)) {
        case "exact":
          return ["The answer's zones are exactly these — no more, no fewer."];
        case "shared":
          return zones === 1
            ? ["The answer has this zone and at least one other besides."]
            : ["At least one of these is the answer's, but the two sets aren't the same. Which one isn't said."];
        case "none":
          return [
            zones === 1
              ? "The answer doesn't have this zone."
              : `The answer has none of these, which rules out all ${zones} at once.`,
          ];
      }
    },
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
        facts.push({ key: `${key}Excluded`, header, label: notList(inDomainOrder(ruledOut).map(label)), kind: "isnt" });
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
    explain:
      "Every language the country recognises officially. This is the only column where one guess can " +
      "score several ways at once, so the chips are coloured individually and the column takes the best of them.",
    // Deliberately general where every other category's is specific, because
    // this is the one slot whose state isn't a single thing: Canada against a
    // French answer has French green and English amber, and the column scores
    // green off the French. A line keyed on the column's own state would
    // either talk about the hit and ignore the near-miss, or the reverse. So
    // the per-chip half lives on the chip's own lineage ladder, where the
    // amber that prompted the question is already what opens it, and this
    // only points there.
    explainState: (f) => {
      const near = f.languageChips.filter((c) => c.state === "family");
      if (near.length === 0) return [];
      return [
        near.length === 1
          ? `${near[0].name} is amber: the answer speaks something in the same family, but not ${near[0].name} itself.`
          : "An amber chip means the answer speaks something in that language's family, but not that language itself.",
        "Tap an amber chip for the family tree, and how far up the two branches meet.",
      ];
    },
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

      // Every language a guess offered and didn't land is ruled out, whether
      // the chip came back red or amber: `correct` is set by name equality
      // against the target's own list, so anything else means the target
      // doesn't speak it. The amber ones are the reason this fact has to
      // exist. A Portuguese chip that scores family says two things — the
      // target is somewhere in Romance, and it is not Portuguese — and only
      // the first was being written down, leaving the player to hold the
      // other half in their head across six guesses.
      //
      // This is the opposite call to the one currency got, and the domains
      // are the reason. Both run to ~140 values mostly held by a single
      // country, but nobody guesses a country for its Kenyan shilling,
      // whereas the languages that actually turn up in guesses are the wide
      // ones: ruling out English drops 59 countries in a stroke, French 31,
      // Arabic 24, Spanish 21. "Not French, not Portuguese" is a real
      // narrowing of the field; "not the Kenyan shilling" never was.
      const ruledOut: string[] = [];
      for (const g of guesses) {
        for (const chip of g.languageChips) {
          if (chip.state !== "correct" && !ruledOut.includes(chip.name)) ruledOut.push(chip.name);
        }
      }
      // Sits alongside the positives rather than replacing them: knowing one
      // of the target's languages never closes the column, since it can speak
      // others, so a confirmed language and a list of exclusions are both
      // live at once and need separate keys to share the rail.
      if (ruledOut.length > 0) {
        facts.push({
          key: "languageExcluded",
          header: "Languages",
          label: notList(ruledOut),
          kind: "isnt",
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
    explain:
      "Which of the five great land groupings the country is counted in: Africa, the Americas, Asia, Europe or Oceania.",
    match: (f) => f.sameContinent,
    label: (f) => f.country.continent,
    excluded: (f) => [f.country.continent],
  }),
  setCategory({
    key: "climate",
    header: "Climate",
    daily: "rotating",
    explain:
      "The broad Köppen zones - tropical, arid, temperate, continental, polar - covering a fair share of the " +
      "country's land. Most have one; a big, varied country has several, and all of them are listed.",
    domain: CLIMATE_ZONES,
    of: (country) => country.climateZones,
    match: (f) => f.climateMatch,
    label: (zone) => CLIMATE_ZONE_LABEL[zone] ?? zone,
  }),
  tertileCategory({
    key: "population",
    header: "Population",
    daily: "rotating",
    explain: "How many people live there.",
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
    explain: "Total land area in square kilometres.",
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
    explain:
      "Letters in the country's common name. Spaces, hyphens and apostrophes aren't letters and aren't counted, " +
      "so New Zealand is 10 and Côte d'Ivoire is 11. Accented letters are letters and do count.",
    square: (f) => f.nameLengthDirection,
    of: (f) => f.nameLengthTertile,
    ranges: NAME_LENGTH_TERTILE_RANGES,
    formatBound: String,
    unit: "letters",
    exactValue: (f) => (f.sameNameLengthValue ? letterCount(f.country.name) : null),
    // The only column that supplies one: with a dozen letter counts in the
    // whole dataset, a guess landing in the answer's third without matching
    // it is common, and the count it just ruled out is worth saying.
    guessedValue: (f) => letterCount(f.country.name),
  }),
  tertileCategory({
    key: "borders",
    header: "Borders",
    daily: "rotating",
    explain:
      "How many countries it shares a land border with. Islands have none, however many neighbours they have " +
      "across the water.",
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
    explain:
      "The UN's summary of how well a country provides for the people in it: life expectancy, years of schooling " +
      "and income per head, folded into a single figure between 0 and 1. Higher is better provided for. It says " +
      "nothing about size, and nothing directly about wealth.",
    square: (f) => f.hdiDirection,
    of: (f) => f.hdiTertile,
    ranges: HDI_TERTILE_RANGES,
    formatBound: formatHdi,
    exactValue: (f) => (f.sameHdiValue ? f.country.hdi : null),
    // North Korea and Vatican City, the only two the UNDP publishes no
    // figure for. The end-of-game reveal has always marked their HDI as an
    // estimate; the board scored a third off that estimate and said nothing,
    // which is the one place on the board where a tile isn't quite the hard
    // fact every other tile is. The scoring is unchanged — a guess has to
    // sit somewhere — but the player is told what it sat on.
    note: (f) =>
      f.country.hdiEstimated
        ? `The UN publishes no HDI for ${f.country.name}. This is an unofficial estimate, so the third it lands in is a best guess too.`
        : undefined,
  }),
  // Population and land area are both already here, and density is neither
  // of them: it is the one column that separates countries the other two
  // agree on, which is why it earns a slot beside them rather than
  // duplicating one. Singapore and Ireland share a population tertile and
  // nothing else on the board says how differently they are packed.
  tertileCategory({
    key: "density",
    header: "Population Density",
    daily: "rotating",
    explain:
      "People per square kilometre: the population divided by the land area. It is the one column that separates " +
      "two countries the population and area columns agree on; a crowded small country from an empty large one.",
    square: (f) => f.densityDirection,
    of: (f) => f.densityTertile,
    ranges: DENSITY_TERTILE_RANGES,
    formatBound: formatDensity,
    unit: "per km²",
    // Never fires between two different countries — it is a ratio of two
    // large numbers — but it is checked the same way the other tertiles
    // check theirs, and costs nothing.
    exactValue: (f) => (f.sameDensityValue ? populationDensity(f.country) : null),
  }),
  flatCategory({
    key: "religion",
    header: "Religion",
    daily: "rotating",
    explain:
      "The religion a majority of the population holds. Where no single one has a majority the column says so, and " +
      "that is itself a value a guess can match.",
    match: (f) => f.sameReligion,
    label: (f) => f.country.religion ?? "No majority",
    excluded: (f) => (f.country.religion ? [f.country.religion] : []),
  }),
  flatCategory({
    key: "government",
    header: "Government",
    daily: "rotating",
    explain:
      "How the state is constituted: republic, constitutional monarchy, federal republic and so on, 23 kinds " +
      "across the dataset.",
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
