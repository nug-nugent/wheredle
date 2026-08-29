// Shared palette and typography (see the "Wheredle game design
// exploration"/Modernist project on claude.ai/design) — flat,
// square-cornered, Archivo-set. Used by both game modes so they read as
// one product.
//
// Guess feedback reads as a traffic light: green for a hit, amber for a
// partial, red for a miss. The green and the red are one OKLCH point with
// only the hue turned — oklch(61.12% 0.2252 …), the accent's own lightness
// and chroma, at 145° and at the accent's own 31.45° (#ec3013) — so the
// pair reads as equally vivid rather than as two unrelated colours. Chrome
// (buttons, badges, links) shares that same red: the palette runs on one
// red, and context rather than hue tells a button from a missed tile.
//
// The neutral greys (muted*) cover everything that is neither hit nor
// miss, which keeps red specific to a guess that went wrong.
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

  wrongBg: "oklch(61.12% 0.2252 31.45deg)",
  wrongBorder: "oklch(61.12% 0.2252 31.45deg)",
  wrongLabel: "rgba(255,255,255,0.75)",
  wrongValue: "#fff5f2",
  wrongIcon: "#fff5f2",

  // Partial credit: a language family match, or a climate that shares a zone
  // with the answer without being the same set — the two places a value can
  // be halfway right, and so the amber between the green and the red. Unlike
  // its neighbours it stays a tinted background with
  // dark text rather than going solid, which is what makes "halfway" read
  // as halfway at a glance.
  //
  // partialBg and partialBgStrong are the two ends of a ramp (see
  // partialTint): the faint end for the shallowest shared ancestry, the
  // strong end for a match one level short of exact, both kept light
  // enough to carry partialValue text. partialSolid is the same amber at
  // full strength, for the history dots — 8px of a tint washes out to
  // nothing next to a solid green or red.
  partialBg: "oklch(94% 0.055 85deg)",
  partialBgStrong: "oklch(86% 0.145 82deg)",
  partialSolid: "oklch(78% 0.165 80deg)",
  partialLabel: "oklch(40% 0.095 65deg)",
  partialValue: "oklch(32% 0.075 65deg)",

  // Neither hit nor miss: the knowledge rail's exclusions, which are
  // something the player has established rather than somewhere they went
  // wrong, and the end-of-game outcome badge, which needs to stay legible
  // against the accent it switches to on a win.
  mutedBg: "#eae7e7",
  mutedBorder: "#d7d3d3",
  mutedLabel: "#605d5d",
  mutedValue: "#605d5d",
} as const;

export const FONT_FAMILY = "'Archivo', system-ui, sans-serif";

// Partial credit comes in degrees: a language chip's tint deepens with how
// much of its ancestry it shares with the target, so a sibling branch reads
// hotter than a common root five millennia back. `strength` runs 0→1 over
// the ramp above, from the palest amber to the richest. Mixed in OKLCH so
// the intermediate steps stay on the same perceptual line rather than
// dipping through a muddier sRGB midpoint.
export function partialTint(strength: number): { bg: string; color: string; sub: string } {
  const percent = Math.round(Math.min(Math.max(strength, 0), 1) * 100);
  return {
    bg: `color-mix(in oklch, ${COLORS.partialBg}, ${COLORS.partialBgStrong} ${percent}%)`,
    color: COLORS.partialValue,
    sub: COLORS.partialLabel,
  };
}

// The guesses-remaining countdown runs the same traffic light as the guess
// feedback, only stretched over the game rather than over one guess: full
// green with everything still to play for, through the partials' amber, to
// red on the last guess. Mixed between correctBg and wrongBg, which are one
// OKLCH point with only the hue turned, so every step keeps their lightness
// and chroma and the final guess lands exactly on the accent the chip wore
// before it had a ramp. `urgency` runs 0→1 from the first guess to the last.
export function countdownTint(urgency: number): string {
  const percent = Math.round(Math.min(Math.max(urgency, 0), 1) * 100);
  return `color-mix(in oklch, ${COLORS.correctBg}, ${COLORS.wrongBg} ${percent}%)`;
}
