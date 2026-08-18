// Shared palette and typography (see the "Wheredle game design
// exploration"/Modernist project on claude.ai/design) — flat,
// square-cornered, Archivo-set. Used by both game modes so they read as
// one product.
//
// "Correct" indicators (tiles, chips, dots, the Confirmed panel) use a
// green rather than the brand red, so a match doesn't read as a warning
// and isn't visually confused with the accent used for chrome (buttons,
// borders, links, badges). That green is derived in OKLCH from the
// accent's own lightness and chroma — oklch(61.12% 0.2252 31.45) for
// #ec3013 — with only the hue rotated to green (145°), so the two read as
// equally vivid/dark rather than as two unrelated colours.
export const COLORS = {
  page: "#e7e5e5",
  surface: "#f3f2f2",
  text: "#201e1d",
  textDimmed: "rgba(32,30,29,0.55)",
  textFaint: "rgba(32,30,29,0.5)",
  border: "rgba(32,30,29,0.4)",
  borderFaint: "rgba(32,30,29,0.25)",
  borderDashed: "rgba(32,30,29,0.35)",
  inputBg: "#eae9e9",

  accent: "#ec3013",
  accentHover: "#ae1800",

  correctBg: "oklch(61.12% 0.2252 145deg)",
  correctBorder: "oklch(61.12% 0.2252 145deg)",
  correctLabel: "rgba(255,255,255,0.75)",
  correctValue: "#f2fff5",
  correctIcon: "#f2fff5",

  wrongBg: "#eae7e7",
  wrongBorder: "#d7d3d3",
  wrongLabel: "#605d5d",
  wrongValue: "#605d5d",
  wrongIcon: "#9b9797",

  directionBg: "#f8f4f4",
  directionBorder: "#ffc4b8",
  directionLabel: "#ae1800",
  directionValue: "#201e1d",
  directionIcon: "#ae1800",

  partialBg: "#ffe0d9",
  partialBorder: "#ffc4b8",
  partialLabel: "#7c1405",
  partialValue: "#4d170e",
} as const;

export const FONT_FAMILY = "'Archivo', system-ui, sans-serif";
