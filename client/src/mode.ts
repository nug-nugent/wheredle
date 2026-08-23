// Which of the two modes this page is, and how to link across to the other.
// There's no router (see the README) — the mode is whatever the URL ends in,
// settled once at load. main.tsx picks the page from it; the nav menu needs
// the same answer for its rules and its link across, and two copies of the
// path-parsing would be two chances to disagree.

export type Mode = "wheredle" | "alex";

export const MODE: Mode = window.location.pathname.replace(/\/+$/, "").endsWith("/alex") ? "alex" : "wheredle";

export const OTHER_MODE: Mode = MODE === "alex" ? "wheredle" : "alex";

// Built on Vite's base rather than written out, since the deployed site sits
// under /wheredle/ and a hand-written "/alex" would land off the site
// entirely. BASE_URL always ends in a slash.
export const MODE_URL: Record<Mode, string> = {
  wheredle: import.meta.env.BASE_URL,
  alex: `${import.meta.env.BASE_URL}alex`,
};

// How each mode is named in a link across to the other, phrased to sit
// mid-sentence in either place it's used. The main game has no name of its
// own beyond the product's — it is the game, and "Alex mode" is the variant,
// so "the main game" tells a player what they're clicking towards in a way
// "Wheredle" wouldn't from inside Wheredle.
export const MODE_LABEL: Record<Mode, string> = {
  wheredle: "the main game",
  alex: "Alex mode",
};

export const PAGE_TITLE: Record<Mode, string> = {
  wheredle: "Wheredle",
  alex: "Wheredle - Alex mode",
};
