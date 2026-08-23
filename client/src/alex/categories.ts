import type { GuessFeedback, LanguageChip, SquareState, Tertile, TertileRanges, TileFlag } from "./engine";
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
      // Narrower than SquareState on purpose: a tile is a hit or a miss,
      // with no halfway state to paint.
      square: (f: GuessFeedback) => TileFlag;
      label: (f: GuessFeedback) => string;
    })
  | (CategoryCommon & {
      cell: "chips";
      square: (f: GuessFeedback) => SquareState;
    });

const TERTILE_ORDER: Tertile[] = ["bottom", "middle", "top"];

// A category whose values bucket into thirds. A wrong guess rules out the
// guessed country's own tertile, so one eliminated tertile becomes an
// exclusion and two become a certainty — the survivor *is* the target's,
// since a guess is flagged wrong precisely when its tertile differs. That's
// why it joins the positives rather than being hedged into a tier of its own.
function tertileCategory(config: {
  key: string;
  header: string;
  daily: DailySlot;
  square: (f: GuessFeedback) => TileFlag;
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

  return {
    key,
    header,
    daily,
    kind: "tertile",
    cell: "tile",
    square,
    label: (f) => TERTILE_LABEL[of(f)],
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
    exactValue: (f) => (f.sameNameLengthValue ? f.country.name.length : null),
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
  flatCategory({
    key: "currency",
    header: "Currency",
    daily: "rotating",
    match: (f) => f.sameCurrency,
    label: (f) => f.country.currencies.join(", ") || "Unknown",
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
