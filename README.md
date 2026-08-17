# Wheredle

A daily country-guessing game. Players narrow down a target country through a
sequence of hints, trying to guess it in as few attempts as possible.

## What's here

A React + Vite + Mantine frontend (`client/`), no backend yet. All game state
is client-side and ephemeral — nothing is persisted, no accounts, no
leaderboards. That's the natural next step once the core game feel is
settled, not something in progress now.

Two game modes live side by side, both reading from the same country dataset:

- **`/`** — the main game. Six fixed questions in sequence: a letter in the
  country's name, a zoomed segment of its flag, then the player's choice of
  continent / population / language (in any order) until all three are used,
  then the full flag as the final guess. See `client/src/game/`.
- **`/alex`** — an alternate, Wordle-style mode with no upfront clues: guess a
  country, get back a table of how similar it was to the answer across
  continent, population, land area, name length, flag colour count, border
  count, religion, government type, currency, and a full language-family
  breakdown. Categories that get confirmed by a match move into a separate
  "Confirmed" summary so the guess table narrows as you go, rather than
  staying maxed out at 11 columns for the whole game. See `client/src/alex/`.
  ("Alex" is just whoever originally asked for this variant — the name has no
  functional meaning, it's not a build flag or user role.)

There's no routing library — `client/src/main.tsx` just switches on
`window.location.pathname` between the two, since it's only ever these two
static pages.

## Data

`client/src/data/countries.json` is generated, not hand-maintained. Regenerate
with:

```bash
cd client
npm run data:fetch
```

`client/scripts/fetch-countries.mjs` pulls from a few free sources (mledoze/countries,
samayo/country-json) and merges them by country name, which requires a couple of
NAME_OVERRIDES maps since the source repos don't always agree on naming for
the same country. The script's own comments explain which override applies
to which field and why.

One field doesn't come from that script: `flagColorCount` is precomputed in
`client/scripts/flag-colors.json` and merged in as a static lookup. It's a
pixel-based colour count per flag (render to canvas, count colours covering
≥2% of the image, filtering out anti-aliasing and small emblem detail) —
regenerating it needs a browser Canvas, which a plain Node script doesn't
have, so it's checked in rather than fetched live. See the comment block at
the top of `fetch-countries.mjs` for the full methodology if the flag set
ever needs updating.

A few known data gaps, left as-is rather than hand-patched (consistent with
how the rest of the dataset is sourced, not worth a one-off fix):
Micronesia has no currency listed even though it uses the US dollar;
Montenegro has no government-type entry in the source dataset.

## Running it

```bash
cd client
npm install
npm run dev
```

Dev server runs on **port 5003** (set explicitly in `client/vite.config.ts`
and `.claude/launch.json` — the default Vite port was already in use by
something else on the machine this was built on, so 5003 was picked instead
of the usual 5173).
