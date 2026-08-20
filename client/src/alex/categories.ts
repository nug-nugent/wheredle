import type { GuessFeedback, LanguageChip, Tertile, TileFlag } from "./engine";
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

function formatRange(tertile: Tertile, ranges: Record<Tertile, [number, number]>, formatter: (n: number) => string): string {
  const [min, max] = ranges[tertile];
  return min === max ? formatter(min) : `${formatter(min)}–${formatter(max)}`;
}

export interface CategoryDef {
  key: string;
  header: string;
  flag: (f: GuessFeedback) => TileFlag;
  label: (f: GuessFeedback) => string;
  formatBound?: (n: number) => string;
  unit?: string;
  // Only set for the tertile-bucketed categories (population, area, name
  // length, borders). A wrong guess rules out the guessed country's own
  // tertile; getKnownFacts turns one eliminated tertile into an exclusion
  // and two into a certainty (see eliminatedTertiles).
  tertile?: {
    of: (f: GuessFeedback) => Tertile;
    ranges: Record<Tertile, [number, number]>;
  };
  // The guessed country's values for this attribute, for the flat
  // (non-tertile) categories where a wrong guess rules them out. Only set
  // where the domain is small enough that an exclusion actually narrows the
  // field: continent (5 values), religion (7), government (23). Currency and
  // language are left out — their domains run to hundreds of values, most of
  // them held by a single country, so "not Kenyan shilling" says no more
  // than the guess list already does while growing without bound. Returns []
  // where the guessed country has no value to rule out, so a null religion
  // doesn't surface as "not No majority".
  excluded?: (f: GuessFeedback) => string[];
}

// Single source of truth for the tile categories: both the guess list and
// the confirmed rail read from this. Language isn't here — a country can
// speak several languages with a meaningful "family" partial match between
// them, so it gets its own chip list rather than a single tile. Currency
// can also be multi-valued, but with no partial-credit tier worth showing,
// so it stays a plain tile like continent or government.
export const CATEGORIES: CategoryDef[] = [
  {
    key: "continent",
    header: "Continent",
    flag: (f) => (f.sameContinent ? "correct" : "wrong"),
    label: (f) => f.country.continent,
    excluded: (f) => [f.country.continent],
  },
  {
    key: "population",
    header: "Population",
    flag: (f) => f.populationDirection,
    label: (f) => TERTILE_LABEL[f.populationTertile],
    formatBound: formatCompactNumber,
    tertile: { of: (f) => f.populationTertile, ranges: POPULATION_TERTILE_RANGES },
  },
  {
    key: "area",
    header: "Land Area",
    flag: (f) => f.areaDirection,
    label: (f) => TERTILE_LABEL[f.areaTertile],
    formatBound: formatCompactNumber,
    unit: "km²",
    tertile: { of: (f) => f.areaTertile, ranges: AREA_TERTILE_RANGES },
  },
  {
    key: "nameLength",
    header: "Name Length",
    flag: (f) => f.nameLengthDirection,
    label: (f) => TERTILE_LABEL[f.nameLengthTertile],
    formatBound: String,
    unit: "letters",
    tertile: { of: (f) => f.nameLengthTertile, ranges: NAME_LENGTH_TERTILE_RANGES },
  },
  {
    key: "borders",
    header: "Borders",
    flag: (f) => f.borderDirection,
    label: (f) => TERTILE_LABEL[f.borderTertile],
    formatBound: String,
    tertile: { of: (f) => f.borderTertile, ranges: BORDER_TERTILE_RANGES },
  },
  {
    key: "hdi",
    header: "Human Development Index",
    flag: (f) => f.hdiDirection,
    label: (f) => TERTILE_LABEL[f.hdiTertile],
    formatBound: formatHdi,
    tertile: { of: (f) => f.hdiTertile, ranges: HDI_TERTILE_RANGES },
  },
  {
    key: "religion",
    header: "Religion",
    flag: (f) => (f.sameReligion ? "correct" : "wrong"),
    label: (f) => f.country.religion ?? "No majority",
    excluded: (f) => (f.country.religion ? [f.country.religion] : []),
  },
  {
    key: "government",
    header: "Government",
    flag: (f) => (f.sameGovernmentType ? "correct" : "wrong"),
    label: (f) => f.country.governmentType ?? "Unknown",
    excluded: (f) => (f.country.governmentType ? [f.country.governmentType] : []),
  },
  {
    key: "currency",
    header: "Currency",
    flag: (f) => (f.sameCurrency ? "correct" : "wrong"),
    label: (f) => f.country.currencies.join(", ") || "Unknown",
  },
];

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

// Categories whose tertile match can be pinned down to a concrete numeric
// range, so the rail can say "6-7" rather than just repeating "Top third" —
// or, if some correct guess happens to share the target's exact value
// (common for name length and border count, which have few possible values
// and lots of ties), the single precise number instead of the range. Units
// are appended by withUnit, not baked in here.
const CONFIRMED_LABEL: Partial<Record<string, (matched: GuessFeedback, guesses: GuessFeedback[]) => string>> = {
  population: (matched, guesses) => {
    const exact = guesses.find((f) => f.samePopulationValue);
    return exact
      ? formatCompactNumber(exact.country.population)
      : formatRange(matched.populationTertile, POPULATION_TERTILE_RANGES, formatCompactNumber);
  },
  area: (matched, guesses) => {
    const exact = guesses.find((f) => f.sameAreaValue);
    return exact
      ? formatCompactNumber(exact.country.area)
      : formatRange(matched.areaTertile, AREA_TERTILE_RANGES, formatCompactNumber);
  },
  nameLength: (matched, guesses) => {
    const exact = guesses.find((f) => f.sameNameLengthValue);
    return exact ? String(exact.country.name.length) : formatRange(matched.nameLengthTertile, NAME_LENGTH_TERTILE_RANGES, String);
  },
  borders: (matched, guesses) => {
    const exact = guesses.find((f) => f.sameBorderCount);
    return exact ? String(exact.country.borderCount) : formatRange(matched.borderTertile, BORDER_TERTILE_RANGES, String);
  },
  hdi: (matched, guesses) => {
    const exact = guesses.find((f) => f.sameHdiValue);
    return exact ? formatHdi(exact.country.hdi) : formatRange(matched.hdiTertile, HDI_TERTILE_RANGES, formatHdi);
  },
};

const TERTILE_ORDER: Tertile[] = ["bottom", "middle", "top"];

function withUnit(category: CategoryDef, value: string): string {
  return category.unit ? `${value} ${category.unit}` : value;
}

// The tertiles a wrong guess has ruled out. The target's own tertile can
// never land in here — a guess is flagged wrong precisely when its tertile
// differs from the target's — so if only one tertile survives, it *is* the
// target's, known as certainly as if a guess had matched it outright.
function eliminatedTertiles(category: CategoryDef, guesses: GuessFeedback[]): Set<Tertile> {
  const eliminated = new Set<Tertile>();
  if (!category.tertile) return eliminated;
  for (const g of guesses) {
    if (category.flag(g) === "wrong") eliminated.add(category.tertile.of(g));
  }
  return eliminated;
}

// Everything the player has established, in one list: positives first so the
// rail opens with substance, then exclusions. Note there's no separate
// "narrowed down" tier — a tertile pinned down by eliminating the other two
// carries exactly the same certainty as a direct match, so it joins the
// positives rather than being hedged into a category of its own.
export function getKnownFacts(guesses: GuessFeedback[]): KnownFact[] {
  const positives: KnownFact[] = [];
  const negatives: KnownFact[] = [];

  for (const category of CATEGORIES) {
    const matched = guesses.find((f) => category.flag(f) === "correct");
    if (matched) {
      const labelFn = CONFIRMED_LABEL[category.key];
      positives.push({
        key: category.key,
        header: category.header,
        label: withUnit(category, labelFn ? labelFn(matched, guesses) : category.label(matched)),
        kind: "is",
      });
      continue;
    }

    if (category.tertile) {
      const { ranges } = category.tertile;
      const bound = category.formatBound ?? String;
      const eliminated = eliminatedTertiles(category, guesses);
      const remaining = TERTILE_ORDER.filter((t) => !eliminated.has(t));

      if (remaining.length === 1) {
        positives.push({
          key: category.key,
          header: category.header,
          label: withUnit(category, formatRange(remaining[0], ranges, bound)),
          kind: "is",
        });
      } else if (eliminated.size > 0) {
        const ruledOut = TERTILE_ORDER.filter((t) => eliminated.has(t)).map((t) => formatRange(t, ranges, bound));
        negatives.push({
          key: category.key,
          header: category.header,
          label: withUnit(category, `not ${ruledOut.join(", ")}`),
          kind: "isnt",
        });
      }
      continue;
    }

    if (category.excluded) {
      const ruledOut: string[] = [];
      for (const g of guesses) {
        if (category.flag(g) === "correct") continue;
        for (const value of category.excluded(g)) {
          if (!ruledOut.includes(value)) ruledOut.push(value);
        }
      }
      if (ruledOut.length > 0) {
        negatives.push({
          key: category.key,
          header: category.header,
          label: `not ${ruledOut.join(", ")}`,
          kind: "isnt",
        });
      }
    }
  }

  // Confirmed languages are gathered across every guess, not just the first
  // one to land a hit: a target speaking both French and German can have
  // them confirmed by two separate guesses.
  const confirmedLanguages: string[] = [];
  for (const g of guesses) {
    for (const chip of g.languageChips) {
      if (chip.state === "correct" && !confirmedLanguages.includes(chip.name)) confirmedLanguages.push(chip.name);
    }
  }
  if (confirmedLanguages.length > 0) {
    positives.push({ key: "language", header: "Languages", label: confirmedLanguages.join(", "), kind: "is" });
  }

  // The deepest ancestry established without naming a language outright.
  // A partial chip says the target speaks *something* in this branch that
  // hasn't been pinned down yet, which is real, certain narrowing and the
  // one piece of language knowledge that accumulates across guesses without
  // ever appearing above. Exact matches are excluded deliberately: their
  // lineage is fully implied by the Languages fact, so including them would
  // only pad the rail — but a target speaking both French and German still
  // gets "Indo-European → Germanic" from a Dutch guess after French is
  // confirmed, because that points at the language still outstanding.
  let deepest: LanguageChip | undefined;
  for (const g of guesses) {
    for (const chip of g.languageChips) {
      if (chip.state !== "family") continue;
      if (!deepest || chip.sharedDepth > deepest.sharedDepth) deepest = chip;
    }
  }
  if (deepest) {
    positives.push({
      key: "languageFamily",
      header: "Language family",
      label: deepest.lineage.slice(0, deepest.sharedDepth).join(" → "),
      kind: "is",
    });
  }

  return [...positives, ...negatives];
}
