const isBrowser = typeof window !== "undefined";

// Bumped whenever a stored *game* shape changes in a way older saves can't
// be read as. Anything stamped with a different version is discarded rather
// than migrated — a day's half-finished board isn't worth the migration
// code.
//
// Note what counts as the shape changing: a saved game holds whole Country
// objects rather than just their codes, so adding a field to countries.json
// changes this shape too. A game stored before the field existed resumes
// with a country that lacks it, and the first code to read that field throws
// — which is exactly what version 2 is for. Adding climate zones without
// bumping this shipped a build where Alex couldn't accept a guess at all and
// the main game went blank the moment you won, both from reading
// `climateZones` off a country saved before it had one.
const GAME_VERSION = 2;

// The record's shape is independent of the game's, and it's the half worth
// keeping: bumping the two together to discard a half-finished board would
// take every player's streak with it.
const STATS_VERSION = 1;

interface Envelope<T> {
  version: number;
  // Which puzzle this belongs to, so yesterday's board doesn't reappear this
  // morning. Checking the day here rather than letting storage expire is what
  // makes a refresh at 23:59 and one at 00:01 do the right thing.
  day: number;
  state: T;
}

// Local storage for the daily games: progress has to survive closing the tab
// and coming back after lunch, which is the whole point of a puzzle that only
// comes round once a day.
export function loadDaily<T>(key: string, day: number): T | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Envelope<T>;
    if (envelope.version !== GAME_VERSION || envelope.day !== day) return null;
    return envelope.state;
  } catch {
    return null;
  }
}

export function saveDaily<T>(key: string, day: number, state: T): void {
  if (!isBrowser) return;
  try {
    const envelope: Envelope<T> = { version: GAME_VERSION, day, state };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Storage unavailable (private browsing, quota) — progress just won't
    // persist. Nothing downstream depends on it having worked.
  }
}

// A player's running record, which belongs to no particular day — same
// version stamp, no day check. Kept as one serialisable blob so that if
// accounts ever happen, syncing it is an upload rather than a migration.
export function loadStats<T>(key: string): T | null {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as Omit<Envelope<T>, "day">;
    return envelope.version === STATS_VERSION ? envelope.state : null;
  } catch {
    return null;
  }
}

export function saveStats<T>(key: string, state: T): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ version: STATS_VERSION, state }));
  } catch {
    // As above.
  }
}

// Session storage for practice games, which are deliberately throwaway: a
// refresh shouldn't lose the one you're in the middle of, but there's no
// reason for it to still be sitting there tomorrow.
export function loadPractice<T>(key: string): T | null {
  if (!isBrowser) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    // Stamped like a daily one, and for the same reason: a practice game
    // holds the same Country objects, so it goes stale in the same way. It
    // went unstamped until that bit, and an unstamped entry reads as version
    // undefined, which is discarded here exactly as an old one should be.
    const envelope = JSON.parse(raw) as Omit<Envelope<T>, "day">;
    return envelope.version === GAME_VERSION ? envelope.state : null;
  } catch {
    return null;
  }
}

export function savePractice<T>(key: string, state: T): void {
  if (!isBrowser) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ version: GAME_VERSION, state }));
  } catch {
    // As above.
  }
}

export function clearPractice(key: string): void {
  if (!isBrowser) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // As above.
  }
}
