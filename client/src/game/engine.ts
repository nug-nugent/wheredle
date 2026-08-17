import type { Country } from "../data/country";
import { FLAG_ZOOM } from "./flagLayout";
import { pickFlagSegmentFocal } from "./flagSampler";

// Q1 and Q2 always reveal in this fixed order. After that the player picks
// freely among the three ChoosableHintType hints; once all three have been
// used, fullFlag is forced as the final hint. 6 hints total = 6 guesses max.
export type ChoosableHintType = "continent" | "population" | "language";
export type HintType = "letter" | "flagSegment" | ChoosableHintType | "fullFlag";

export const CHOOSABLE_HINTS: readonly ChoosableHintType[] = [
  "continent",
  "population",
  "language",
];
export const MAX_GUESSES = 6;

export interface LetterHint {
  type: "letter";
  letter: string;
}
export interface FlagSegmentHint {
  type: "flagSegment";
  focalX: number; // 0-100, percentage position of the crop's centre
  focalY: number; // 0-100
}
export interface SimpleHint {
  type: "continent" | "population" | "language" | "fullFlag";
}
export type Hint = LetterHint | FlagSegmentHint | SimpleHint;

export interface GuessRecord {
  country: Country;
  correct: boolean;
}

export interface GameState {
  target: Country;
  hints: Hint[];
  guesses: GuessRecord[];
  status: "playing" | "won" | "lost";
}

export type NextHintPlan =
  | { kind: "auto"; hint: HintType }
  | { kind: "choice"; options: ChoosableHintType[] }
  | { kind: "done" };

function randomLetter(name: string): string {
  const letters = Array.from(new Set(name.toUpperCase().replace(/[^A-Z]/g, "")));
  return letters[Math.floor(Math.random() * letters.length)];
}

function buildHint(type: Exclude<HintType, "flagSegment">, target: Country): Hint {
  switch (type) {
    case "letter":
      return { type: "letter", letter: randomLetter(target.name) };
    default:
      return { type };
  }
}

async function buildFlagSegmentHint(target: Country): Promise<Hint> {
  const { focalX, focalY } = await pickFlagSegmentFocal(target.flagUrl, FLAG_ZOOM);
  return { type: "flagSegment", focalX, focalY };
}

export function startGame(target: Country): GameState {
  return {
    target,
    hints: [buildHint("letter", target)],
    guesses: [],
    status: "playing",
  };
}

function revealedTypes(state: GameState): HintType[] {
  return state.hints.map((h) => h.type);
}

// What should happen after the current guess resolves as wrong: reveal a
// specific hint automatically, or let the player choose among what's left.
export function planNextHint(state: GameState): NextHintPlan {
  const revealed = revealedTypes(state);
  if (!revealed.includes("flagSegment")) return { kind: "auto", hint: "flagSegment" };

  const remaining = CHOOSABLE_HINTS.filter((h) => !revealed.includes(h));
  if (remaining.length > 1) return { kind: "choice", options: remaining };
  if (remaining.length === 1) return { kind: "auto", hint: remaining[0] };

  if (!revealed.includes("fullFlag")) return { kind: "auto", hint: "fullFlag" };
  return { kind: "done" };
}

// Non-null while the game is waiting on the player to pick the next hint
// category, rather than waiting on a guess.
export function pendingChoice(state: GameState): ChoosableHintType[] | null {
  if (state.status !== "playing") return null;
  if (state.hints.length !== state.guesses.length) return null;
  const plan = planNextHint(state);
  return plan.kind === "choice" ? plan.options : null;
}

export function chooseHint(state: GameState, hint: ChoosableHintType): GameState {
  const plan = planNextHint(state);
  if (plan.kind !== "choice" || !plan.options.includes(hint)) return state;
  return { ...state, hints: [...state.hints, buildHint(hint, state.target)] };
}

export async function submitGuess(state: GameState, guessed: Country): Promise<GameState> {
  if (state.status !== "playing" || pendingChoice(state)) return state;
  if (state.guesses.some((g) => g.country.cca3 === guessed.cca3)) return state;

  const correct = guessed.cca3 === state.target.cca3;
  const guesses = [...state.guesses, { country: guessed, correct }];

  if (correct) return { ...state, guesses, status: "won" };
  if (guesses.length >= MAX_GUESSES) return { ...state, guesses, status: "lost" };

  const plan = planNextHint(state);
  if (plan.kind === "auto") {
    const hint =
      plan.hint === "flagSegment"
        ? await buildFlagSegmentHint(state.target)
        : buildHint(plan.hint, state.target);
    return { ...state, guesses, hints: [...state.hints, hint] };
  }
  return { ...state, guesses };
}
