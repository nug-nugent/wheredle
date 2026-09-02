# Wheredle

A daily country-guessing game. Players narrow down a target country through a
sequence of hints, trying to guess it in as few attempts as possible.

## What's here

A React + Vite + Mantine frontend (`client/`), no backend — deliberately.
Both modes set the same puzzle for everyone each day, worked out from the
date rather than fetched, so there is nothing to host. Progress and a
player's record — games played, win rate, average guesses, current and best
streak — are kept
in the browser (`client/src/storage.ts`, `client/src/stats.ts`); there are no
accounts and no leaderboards, which are the only parts that would actually
need a server. Both are stored under a version stamp as one serialisable
blob, so if accounts ever do happen, syncing a streak is an upload rather
than a migration.

Because there is no server, those saves are written by whichever build of the
code was deployed when the player last touched the game — which may be an
older one than the code now reading them. That makes every type reachable
from a saved game a compatibility surface, including ones that look purely
internal: a saved game holds whole `Country` and `GuessFeedback` objects, so
adding a field to the dataset or renaming one on a guess is a storage change.
Two such changes took the game down in three different ways before the resume
path was rewritten to stop trusting saves. It now keeps only the country codes and rebuilds
everything derived against current code, so a stale save repairs itself
rather than crashing, and a player keeps the board they were on. The rules
for changing any of it are in `CLAUDE.md`.

The day model lives in `client/src/daily.ts`: a fixed epoch, a day number
that rolls over at **local** midnight, and a seeded hash. Everything a
puzzle needs to be the same for two strangers comes from there — the answer
(`client/src/dailyTarget.ts`), which letter the first clue reveals, where
the flag crop is taken, and which categories /alex deals. Selection is done
by ranking candidates on a hash of the day and the candidate's own stable
key, rather than by shuffling a list, so adding a country or a category
disturbs as little of the existing sequence as possible.

The menu's "practice game" runs a random puzzle alongside the daily one
without disturbing it — a separate board in session storage, marked in the
nav, labelled as practice in anything shared from it, and left out of the
streak, which is meant to measure turning up each day.

Finishing the day's game reveals the countdown to the next puzzle, a share
grid headed with the puzzle number so two grids can be compared, and a
Statistics button opening the record for that mode
(`client/src/shell/StatsModal.tsx`) — the headline figures plus a bar per
guess count, with the game just finished picked out and a final bar for games
lost, so the chart accounts for every game played rather than only the won
ones. The record lives behind a button rather
than inline because the end-of-game panel already carries an outcome badge,
the country in full, a share button and a countdown before the player
reaches their own guesses. The two modes are counted separately — different
guess limits and different boards, so a combined streak would mean nothing —
and practice games count towards neither, which is why the button only
appears on a finished daily game.
The number also sits under the wordmark while the puzzle is being played.

Sharing uses the platform's share sheet where there is one — one tap, since
that sheet lists whatever the player actually messages their friends on.
Desktop Edge advertises `navigator.share`, resolves the promise and never
opens anything, and no capability query tells that apart from a working
sheet, so it is caught afterwards instead: a resolve too fast for a sheet to
have been opened and picked from falls back to a clipboard copy. Browsers
without the API get a menu of copy, WhatsApp and email.

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
  "Confirmed" summary so the guess table narrows as you go. Only six of the
  ten categories are dealt on any given day — continent and name length
  always, plus four drawn for the day — which is what keeps the table
  readable rather than maxed out for the whole game. Language is one of the
  categories drawn, not a fixture beside them. See `client/src/alex/`.

  The board is drawn to fit the answer, not the other way round
  (`client/src/alex/dailyBoard.ts`). Six categories are few enough that many
  combinations leave whole clumps of countries scoring identically against
  every possible guess — unwinnable, not merely hard — so the day picks its
  answer first and then walks alternative draws until it finds a board that
  can single that answer out. Ten countries no board can ever separate from
  another (Antigua and Barbuda and Saint Kitts and Nevis among them) are
  kept out of the daily rotation entirely; they still turn up as guesses and
  in practice games.

  `npm run check:daily` is what backs that claim. It replays two years of
  draws through the real game modules and reports how often a day's answer
  is one its board can't identify, plus how much the best opening guess
  narrows the field. It exits non-zero if any day is unwinnable, so a change
  to the categories or the dataset that quietly breaks the draw shows up.
  ("Alex" is just whoever originally asked for this variant — the name has no
  functional meaning, it's not a build flag or user role.)

Both modes share the guess box (`client/src/game/GuessInput.tsx`). It matches
alternate names as well as the dataset's own — official long forms, former
names, abbreviations, a few endonyms — and tolerates a typo or two, so
"Ivory Coast", "Burma", "DRC" and "phillipines" all find their country. The
alias list (`client/src/game/countryAliases.ts`) is hand-maintained, unlike
the dataset it keys into; the ranking and typo tolerance live in
`client/src/game/countryMatch.ts`.

There's no routing library — `client/src/mode.ts` reads the mode off
`window.location.pathname` once, and `client/src/main.tsx` switches on it,
since it's only ever these two static pages. The deploy copies `index.html`
to `404.html`, which is what lets Pages serve `/alex` at all.

The rest of the menu is text: how to play (the rules of whichever mode you're
in), more games, and about — one modal frame in `client/src/about/` with a
panel per view, rendered from `NavMenu` rather than per mode, so both modes
get them without either knowing about it. The other games are listed in
`client/src/data/games.ts`, hand-maintained unlike the dataset beside it.

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

Dev server runs on **port 5317** (set explicitly in `client/vite.config.ts`
and `.claude/launch.json`). Vite's own default, 5173, was already taken on
the machine this was built on; so, later, was the 5003 that replaced it —
hence the third and deliberately unremarkable number.
