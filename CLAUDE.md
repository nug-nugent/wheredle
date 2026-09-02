# Project conventions

- Use British English spelling in all prose, UI copy, comments, and documentation (e.g. "colour", "favourite", "organise", "centre") — not American English ("color", "favorite", "organize", "center"). This applies to user-facing text and comments; code identifiers that follow an external API's own spelling (e.g. CSS's `backgroundColor`) are exempt.

## A saved game is a compatibility surface

There is no backend, so `localStorage` and `sessionStorage` hold games
written by **older builds of this code**, sometimes minutes older. Anything
reachable from a saved game is therefore a shape you have to stay compatible
with — and it will not look like one, because you'll be editing a type in
`data/country.ts` or `alex/engine.ts` with nothing on screen to say it ends
up on disk.

Two changes of this kind have taken the game down, in three different ways.
Adding `climateZones` to `Country` left Alex unable to accept any guess at
all and blanked the main game the moment you won, because a saved game holds
whole `Country` objects and both paths read a field the saved copy predated.
Splitting `sameClimate` into `climateMatch` on `GuessFeedback` blanked Alex's
daily the next day, because a saved game holds whole `GuessFeedback` objects
too. Each was a one-line type change that looked local and wasn't.

**The rule: never read a derived value back out of a save.** Both hooks'
`resume()` (`alex/useAlexGame.ts`, `game/useGame.ts`) now keep only the
country codes and rebuild everything else against the current code, so a
stale save repairs itself instead of crashing. Keep it that way.

If you add or change a field on `Country`, `GuessFeedback`, `AlexGameState`,
`GameState` or `Stats`, you have two options and no third:

1. Make `resume()` recompute it. Preferred — nobody loses their board.
2. Bump `GAME_VERSION` in `storage.ts`. Every player in a game loses it, so
   this is for changes a rebuild genuinely can't absorb, like the envelope
   itself or `categoryKeys` coming to mean something different. Note
   `STATS_VERSION` is separate and should almost never move: bumping it
   wipes every player's streak.

There is a check for exactly this, and it is the thing to run:

```bash
cd client && npm run check:saves
```

It builds a real game, degrades the serialised copy the ways a deploy
degrades one — a dataset field gone, a feedback field renamed, a guess
hollowed out to nothing but its country — and asserts `resume()` rebuilds an
answer identical to one computed fresh. It fails on both of the changes
described above, so it would have caught either before it shipped.

Add a case to it whenever a saved shape changes in a genuinely new way.

It runs on every pull request and again before the deploy, so it can't be
skipped — but run it locally anyway. The feedback is seconds rather than the
minutes CI takes to tell you the same thing.

## Run the daily check after touching a category or the dataset

Both check scripts run in CI — on the pull request via
`.github/workflows/checks.yml`, and again before the build in
`deploy.yml`, so a failure stops the deploy rather than shipping. Both are
cheap; run them together after any change to the
dataset, the categories, or anything a save touches.

```bash
cd client && npm run check:daily
```

It replays 730 days and exits non-zero if any day's board can't single its
own answer out — an unwinnable puzzle, which the player experiences as the
game being broken. Adding, removing or rescoring a category changes which
boards get drawn for every day, so this is not optional after those edits.

It also reports how much the best opening guess narrows the field, which is
the closest thing to a difficulty measure the project has.

## Changing the daily pool reshuffles most answers

`dailyTarget` derives both the cycle number and the index from the length of
the pool it's given, so adding or removing a single country from
`DAILY_TARGET_POOL` changes what most days answer — not just that country's.
Retiring one category moved the pool 184 → 182, which left the first hundred
days untouched and then changed roughly half the answers in the rest of that
cycle and all of them thereafter, once the shorter cycle changes the salt.

Games already in progress are safe, since they store their own target, but
measure the shift before shipping if players are mid-season rather than
assuming it's local.

## Verify in the browser, not by reasoning

The dev server is `npm run dev` in `client/` on port 5317, and the app is
served under the `/wheredle/` base path, so the modes live at
`localhost:5317/wheredle/` and `localhost:5317/wheredle/alex`. Bare `/alex`
gets you Vite's "configured with a public base URL" notice, not the game.
Guesses,
reveals and resumed saves are all easy to drive from the console and hard to
be sure about from the code alone; every bug in the list above was confirmed
that way before being fixed, and each looked fine on paper.
