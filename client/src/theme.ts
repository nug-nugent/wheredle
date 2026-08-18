// Shared palette and typography (see the "Wheredle game design
// exploration" project on claude.ai/design) — flat, square-cornered,
// Archivo-set, with the brand red marking a match rather than green.
// Used by both game modes so they read as one product.
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

  correctBg: "#ec3013",
  correctBorder: "#ec3013",
  correctLabel: "rgba(255,255,255,0.75)",
  correctValue: "#fff2ef",
  correctIcon: "#fff2ef",

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
