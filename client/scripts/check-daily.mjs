// Does a pared-down board still identify a country?
//
// /alex shows six categories a day instead of ten, and gives the player six
// guesses. Two countries that score identically against *every* possible
// guess can never be told apart, no matter how many guesses there are — the
// player can only pick one and hope, which is a lost game rather than a hard
// one. A straight draw of six leaves about a fifth of days like that, so the
// day's board is instead drawn to fit the day's answer, walking alternative
// draws until one can single that answer out.
//
// This checks the joint draw delivers, on two measures:
//
//   1. Unfair days — days whose answer the board still can't single out.
//      Should be none; the script exits non-zero if not.
//   2. Expected candidates left after the best opening guess — a proxy for
//      search difficulty, which the first measure says nothing about. A board
//      where the answer is findable in principle can still be unfindable in
//      six guesses if nothing narrows the field.
//
// What a guess reveals doesn't depend on which categories are shown, so the
// whole guess-by-target matrix is built once and every board reads columns
// out of it.
//
// Run with: npm run check:daily

import { createServer } from "vite";

const DAYS_SAMPLED = 730;
const SQUARE_CHAR = { correct: "c", partial: "p", wrong: "w" };

// What a guess actually tells the player about one category. For a tile
// that's its hit-or-miss state — the value on it is the guessed country's
// own, which the player already knew. For the chips it's every chip
// separately, with how deep its shared ancestry runs, since the board shows
// them individually. Collapsing those to the single square the share grid
// uses would credit the player with far less than they can see, and make
// boards look unfair that aren't.
function observable(category, feedback) {
  if (category.cell === "tile") return SQUARE_CHAR[category.square(feedback)];
  return feedback.languageChips.map((c) => `${c.state}${c.sharedDepth}`).join("+");
}

// Vite's SSR loader rather than a plain import, so the script measures the
// real modules the game plays with — extensionless TypeScript imports, JSON
// and all — without the project taking on a TypeScript runner as a dependency.
async function loadGameModules() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "warn",
  });

  try {
    const [{ countries }, engine, { CATEGORIES }, board, { dailyTarget }] = await Promise.all([
      server.ssrLoadModule("/src/data/country.ts"),
      server.ssrLoadModule("/src/alex/engine.ts"),
      server.ssrLoadModule("/src/alex/categories.ts"),
      server.ssrLoadModule("/src/alex/dailyBoard.ts"),
      server.ssrLoadModule("/src/dailyTarget.ts"),
    ]);
    return { countries, engine, CATEGORIES, board, dailyTarget };
  } finally {
    await server.close();
  }
}

// matrix[guess][target] — what that guess reveals, one entry per category in
// CATEGORIES order.
function buildObservationMatrix(countries, engine, categories) {
  const byTarget = countries.map((target) =>
    countries.map((guessed) => {
      const feedback = engine.computeGuessFeedback(target, guessed);
      return categories.map((c) => observable(c, feedback));
    })
  );
  // Built target-major above; transpose so the lookup reads as [guess][target].
  return countries.map((_, g) => byTarget.map((row) => row[g]));
}

function groupBy(values) {
  const groups = new Map();
  values.forEach((value, index) => {
    const bucket = groups.get(value);
    if (bucket) bucket.push(index);
    else groups.set(value, [index]);
  });
  return [...groups.values()];
}

// Everything a board can tell you about each target, as one string per
// target: how it scores against every possible guess. Two targets sharing a
// signature are indistinguishable on that board.
function signatures(matrix, countries, activeIndices) {
  return countries.map((_, t) => {
    const parts = [];
    for (let g = 0; g < countries.length; g++) {
      const seen = matrix[g][t];
      for (const i of activeIndices) parts.push(seen[i]);
    }
    return parts.join("|");
  });
}

// Expected candidates surviving one guess, averaged over the targets it could
// be facing: sum of each feedback class's size squared, over the total. The
// best guess on the board is the one that leaves fewest.
function bestOpeningGuess(matrix, countries, activeIndices) {
  let best = { expected: Infinity, name: null };

  for (let g = 0; g < countries.length; g++) {
    const classes = groupBy(
      countries.map((_, t) => {
        const seen = matrix[g][t];
        return activeIndices.map((i) => seen[i]).join("|");
      })
    );
    const expected = classes.reduce((sum, c) => sum + c.length * c.length, 0) / countries.length;
    if (expected < best.expected) best = { expected, name: countries[g].name };
  }

  return best;
}

function analyseBoard(matrix, countries, activeIndices) {
  const classes = groupBy(signatures(matrix, countries, activeIndices));
  const ambiguous = classes.filter((c) => c.length > 1);

  return {
    // The countries this board can't tell apart from something else, by index.
    ambiguous: new Set(ambiguous.flat()),
    distinct: classes.length,
    largestClass: classes.reduce((max, c) => Math.max(max, c.length), 0),
    worstExample: ambiguous.sort((a, b) => b.length - a.length)[0]?.map((i) => countries[i].name) ?? null,
    opening: bestOpeningGuess(matrix, countries, activeIndices),
  };
}

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

const { countries, engine, CATEGORIES, board, dailyTarget } = await loadGameModules();
const { dailyBoard, DAILY_TARGET_POOL, ROTATING_SLOTS } = board;

const matrix = buildObservationMatrix(countries, engine, CATEGORIES);
const indexOfKey = new Map(CATEGORIES.map((c, i) => [c.key, i]));
const indexOfCca3 = new Map(countries.map((c, i) => [c.cca3, i]));
const alwaysCount = CATEGORIES.filter((c) => c.daily === "always").length;
const poolCount = CATEGORIES.length - alwaysCount;

// Boards repeat constantly across days, so their analysis is worth keeping.
const analysisCache = new Map();
function analysisFor(keys) {
  const id = keys.join(",");
  let cached = analysisCache.get(id);
  if (!cached) {
    cached = analyseBoard(matrix, countries, keys.map((k) => indexOfKey.get(k)));
    analysisCache.set(id, cached);
  }
  return cached;
}

console.log(`${countries.length} countries, ${CATEGORIES.length} categories, ${engine.MAX_GUESSES} guesses`);
console.log(
  `Daily answers drawn from ${DAILY_TARGET_POOL.length} of ${countries.length} countries ` +
    `(${countries.length - DAILY_TARGET_POOL.length} held back as unidentifiable on any board)`
);
console.log();

const baseline = analyseBoard(matrix, countries, CATEGORIES.map((_, i) => i));
console.log(
  `All ${CATEGORIES.length} categories: ${baseline.distinct}/${countries.length} distinguishable, ` +
    `worst class ${baseline.largestClass}, best opener ${baseline.opening.name} ` +
    `leaves ~${baseline.opening.expected.toFixed(1)}`
);
if (baseline.worstExample) console.log(`  indistinguishable even here: ${baseline.worstExample.join(", ")}`);
console.log();

// The end-to-end check: draw each day the way the game does — answer first,
// then a board chosen to suit it — and see whether the answer is findable.
function playOut(slots) {
  const days = [];
  for (let day = 0; day < DAYS_SAMPLED; day++) {
    const target = dailyTarget("alex", day, DAILY_TARGET_POOL);
    const keys = dailyBoard(day, target, slots).map((c) => c.key);
    const analysis = analysisFor(keys);
    days.push({
      day,
      target,
      keys,
      analysis,
      // Checked against the matrix rather than by asking dailyBoard again, so
      // this confirms the drawing logic instead of restating it.
      unfair: analysis.ambiguous.has(indexOfCca3.get(target.cca3)),
    });
  }
  return days;
}

console.log("Answer-first draw, by board size:");
for (let slots = 3; slots <= poolCount; slots++) {
  const days = playOut(slots);
  const unfair = days.filter((d) => d.unfair);
  const openers = days.map((d) => d.analysis.opening.expected);
  console.log(
    `  ${alwaysCount + slots} categories  ` +
      `unfair days ${((unfair.length / days.length) * 100).toFixed(1)}%  ` +
      `opener avg ~${mean(openers).toFixed(1)} worst ~${Math.max(...openers).toFixed(1)}  ` +
      `(${new Set(days.map((d) => d.keys.join(","))).size} boards used)`
  );
}

const configured = playOut(ROTATING_SLOTS);
const stillUnfair = configured.filter((d) => d.unfair);

console.log();
console.log(`Hardest days at the configured ${alwaysCount + ROTATING_SLOTS}, by how little the best opener narrows:`);
for (const d of [...configured].sort((a, b) => b.analysis.opening.expected - a.analysis.opening.expected).slice(0, 6)) {
  console.log(
    `  day ${String(d.day).padStart(3)}  ${d.target.name.padEnd(22)} ` +
      `opener ~${d.analysis.opening.expected.toFixed(1)}  ` +
      `board clumps up to ${d.analysis.largestClass}  ${d.keys.join(" ")}`
  );
}

console.log();
if (stillUnfair.length === 0) {
  console.log(`No unfair days in ${DAYS_SAMPLED}: every answer is one its board can single out.`);
} else {
  console.log(`${stillUnfair.length} of ${DAYS_SAMPLED} days are unfair — the draw is not doing its job:`);
  for (const d of stillUnfair.slice(0, 10)) console.log(`  day ${d.day}  ${d.target.name}  ${d.keys.join(" ")}`);
  process.exitCode = 1;
}
