# Wheredle

A daily country-guessing game. Players narrow down a target country through a
sequence of hints, trying to guess it in as few attempts as possible.

## What's here

A React + Vite + Mantine frontend (`client/`), no backend yet. All game state
is client-side and ephemeral — nothing is persisted, no accounts, no
leaderboards. That's the natural next step once the core game feel is
settled, not something in progress now.

Both modes are built in one shell (`client/src/shell/`) — a nav with the
wordmark, a guesses-left countdown and the menu; one toolbar row for
whatever the player acts on next; then a scrolling main column with a rail
of standing knowledge beside it, which becomes a strip along the bottom on a
phone. Only what goes in those slots differs per mode, so the two read as
one product rather than as two sketches of one. The palette and type they
share live in `client/src/theme.ts`.

Two game modes live side by side, both reading from the same country dataset:

- **`/`** — the main game. Clues reveal in sequence: a letter in the
  country's name, a zoomed segment of its flag, its border outline, then the
  player's choice of continent / population / language (in any order) until
  all three are used, then the full flag as the final guess. The main column
  is the clue stack, newest first, and the rail is the countries already
  spent. See `client/src/game/`.
- **`/alex`** — an alternate, Wordle-style mode with no upfront clues: guess a
  country, get back a table of how similar it was to the answer across
  continent, population, land area, name length, border count, religion,
  government type, currency, and a full language-family
  breakdown. Categories that get confirmed by a match move into a separate
  "Confirmed" summary so the guess table narrows as you go, rather than
  staying maxed out at 11 columns for the whole game. See `client/src/alex/`.
  ("Alex" is just whoever originally asked for this variant — the name has no
  functional meaning, it's not a build flag or user role.)

Both modes share the guess box (`client/src/game/GuessInput.tsx`). It matches
alternate names as well as the dataset's own — official long forms, former
names, abbreviations, a few endonyms — and tolerates a typo or two, so
"Ivory Coast", "Burma", "DRC" and "phillipines" all find their country. The
alias list (`client/src/game/countryAliases.ts`) is hand-maintained, unlike
the dataset it keys into; the ranking and typo tolerance live in
`client/src/game/countryMatch.ts`.

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
