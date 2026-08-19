const isBrowser = typeof window !== "undefined";

// Session storage, not local storage: progress should survive a refresh but
// not linger for days with no daily-reset concept to make sense of it.
export function loadState<T>(key: string): T | null {
  if (!isBrowser) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveState<T>(key: string, state: T): void {
  if (!isBrowser) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage unavailable (private browsing, quota) — progress just won't persist.
  }
}
