import { COLORS } from "./theme";

// The wordmark's globe: a wireframe sphere built the same way an atlas draws
// one — three meridian ellipses sharing the poles, narrowed step by step to
// suggest curvature round the sides, plus one flattened equator. No fill, so
// it reads as a globe rather than a solid disc.
export function GlobeLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <circle cx="24" cy="24" r="22" stroke={COLORS.accent} strokeWidth="1.6" />
      <ellipse cx="24" cy="24" rx="14.5" ry="22" stroke={COLORS.accent} strokeWidth="1.6" />
      <ellipse cx="24" cy="24" rx="6.5" ry="22" stroke={COLORS.accent} strokeWidth="1.6" />
      <ellipse cx="24" cy="24" rx="22" ry="7" stroke={COLORS.accent} strokeWidth="1.6" />
    </svg>
  );
}
