// Does a game saved by an older build still resume?
//
// There's no backend, so localStorage holds games written by whichever build
// was deployed when the player last played. Twice now a one-line type change
// has broken that and taken the game down: adding climateZones to Country
// left Alex unable to accept a guess and blanked the main game on a win, and
// splitting sameClimate into climateMatch on GuessFeedback blanked Alex's
// daily the next day. Both were saved shapes being read back and trusted.
//
// Rather than pin the two shapes that happened to break — which would go
// stale, and only ever catch history repeating exactly — this asserts the
// property that stops the whole class:
//
//   nothing derived is read back out of a save.
//
// It builds a real game, degrades the serialised copy the ways a deploy
// degrades one (a field gone, a field renamed, a whole guess hollowed out to
// just its country), and checks resume() rebuilds an answer identical to one
// computed fresh. A resume that passed the stored copy through fails here,
// which is exactly what both outages did.
//
// Run with: npm run check:saves

import { createServer } from "vite";

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Deep equality against a freshly computed answer. Key order can differ once
// a save has been through JSON and back, so compare structurally.
function same(a, b, path = "") {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => same(a[k], b[k], `${path}.${k}`));
}

const roundTrip = (v) => JSON.parse(JSON.stringify(v));

async function main() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "warn",
  });

  try {
    const [{ countries }, alexEngine, alexHook, gameEngine, gameHook, board] = await Promise.all([
      server.ssrLoadModule("/src/data/country.ts"),
      server.ssrLoadModule("/src/alex/engine.ts"),
      server.ssrLoadModule("/src/alex/useAlexGame.ts"),
      server.ssrLoadModule("/src/game/engine.ts"),
      server.ssrLoadModule("/src/game/useGame.ts"),
      server.ssrLoadModule("/src/alex/dailyBoard.ts"),
    ]);

    const target = countries.find((c) => c.name === "Rwanda");
    const guessed = ["France", "Mali", "Guinea"].map((n) => countries.find((c) => c.name === n));

    // ---- Alex -------------------------------------------------------------
    const categoryKeys = board.dailyBoard(6, target).map((c) => c.key);
    const freshAlex = {
      target,
      categoryKeys,
      // Newest first, as the engine keeps them.
      guesses: [...guessed].reverse().map((c) => alexEngine.computeGuessFeedback(target, c)),
      status: "playing",
    };

    // Every degradation is applied to a serialised copy, since that's what a
    // save actually is.
    const alexCases = {
      "resumes an untouched save": (s) => s,
      "target has lost a dataset field (the climateZones break)": (s) => {
        delete s.target.climateZones;
        for (const g of s.guesses) delete g.country.climateZones;
        return s;
      },
      "a guess field was renamed (the climateMatch break)": (s) => {
        for (const g of s.guesses) {
          g.sameClimate = true;
          delete g.climateMatch;
        }
        return s;
      },
      "every derived field on a guess is gone": (s) => {
        s.guesses = s.guesses.map((g) => ({ country: g.country }));
        return s;
      },
      "a guess carries a field this build has never heard of": (s) => {
        for (const g of s.guesses) g.someFutureField = { nested: true };
        return s;
      },
      "the countries are bare codes with nothing else on them": (s) => {
        s.target = { cca3: s.target.cca3 };
        for (const g of s.guesses) g.country = { cca3: g.country.cca3 };
        return s;
      },
    };

    console.log("Alex mode");
    for (const [name, degrade] of Object.entries(alexCases)) {
      check(name, () => {
        const resumed = alexHook.resume(degrade(roundTrip(freshAlex)));
        assert(resumed !== null, "resume() discarded the save");
        assert(
          same(resumed.target, target),
          "target wasn't re-read from the dataset — a stale country was passed through"
        );
        assert(
          same(resumed.guesses, freshAlex.guesses),
          "guesses weren't rebuilt — stale feedback was passed through, which is what blanks the board"
        );
        assert(same(resumed.categoryKeys, categoryKeys), "categoryKeys should survive verbatim");
        assert(resumed.status === "playing", "status should survive verbatim");
      });
    }

    check("discards a save naming a country the dataset no longer has", () => {
      const s = roundTrip(freshAlex);
      s.target.cca3 = "ZZZ";
      assert(alexHook.resume(s) === null, "should discard rather than resume");
    });

    check("discards a save whose guess names a country the dataset no longer has", () => {
      const s = roundTrip(freshAlex);
      s.guesses[0].country.cca3 = "ZZZ";
      assert(alexHook.resume(s) === null, "should discard rather than resume");
    });

    check("discards a save with no board recorded", () => {
      const s = roundTrip(freshAlex);
      s.categoryKeys = [];
      assert(alexHook.resume(s) === null, "should discard rather than resume");
    });

    // ---- Main game --------------------------------------------------------
    let freshGame = gameEngine.startGame(target, "wheredle:6");
    for (const c of guessed) freshGame = await gameEngine.submitGuess(freshGame, c);

    const gameCases = {
      "resumes an untouched save": (s) => s,
      "target has lost a dataset field (the reveal break)": (s) => {
        delete s.target.climateZones;
        return s;
      },
      "a guessed country has lost a dataset field": (s) => {
        for (const g of s.guesses) delete g.country.climateZones;
        return s;
      },
      "the countries are bare codes with nothing else on them": (s) => {
        s.target = { cca3: s.target.cca3 };
        for (const g of s.guesses) g.country = { cca3: g.country.cca3 };
        return s;
      },
    };

    console.log("\nMain game");
    for (const [name, degrade] of Object.entries(gameCases)) {
      check(name, () => {
        const resumed = gameHook.resume(degrade(roundTrip(freshGame)));
        assert(resumed !== null, "resume() discarded the save");
        assert(
          same(resumed.target, target),
          "target wasn't re-read from the dataset — a stale country was passed through"
        );
        for (const g of resumed.guesses) {
          const live = countries.find((c) => c.cca3 === g.country.cca3);
          assert(same(g.country, live), `guessed country ${g.country.cca3} wasn't re-read from the dataset`);
        }
        assert(resumed.guesses.length === freshGame.guesses.length, "a guess went missing");
        // Clues are derived from the seed and deliberately kept as stored, so
        // that a board in progress can't shift under a player at midnight.
        assert(same(resumed.hints, roundTrip(freshGame).hints), "hints should survive verbatim");
        assert(resumed.seed === freshGame.seed, "seed should survive verbatim");
      });
    }

    check("discards a save with no seed", () => {
      const s = roundTrip(freshGame);
      delete s.seed;
      assert(gameHook.resume(s) === null, "should discard rather than resume");
    });

    check("discards a save naming a country the dataset no longer has", () => {
      const s = roundTrip(freshGame);
      s.target.cca3 = "ZZZ";
      assert(gameHook.resume(s) === null, "should discard rather than resume");
    });
  } finally {
    await server.close();
  }

  console.log("");
  if (failures > 0) {
    console.error(
      `${failures} check(s) failed. A saved game from the deployed build will break on resume — ` +
        `either rebuild the field in resume(), or bump GAME_VERSION and accept that every player ` +
        `in a game loses it. See the save contract in CLAUDE.md.`
    );
    process.exit(1);
  }
  console.log("Every degraded save resumed as a freshly computed one.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
