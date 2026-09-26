import type { CSSProperties } from "react";
import { COLORS } from "../theme";
import { FLAG_CROP_SIZE, cropOrigin, flagGeometry } from "./flagLayout";
import { useFlagAspect } from "./useFlagAspect";

// The window is the one thing on the page pointing at something, and
// the palette has exactly one colour for that job.
const HIGHLIGHT_COLOR = COLORS.accent;

// The whole flag greyed out, with a small window cut into it showing the
// real flag pixels for the region FlagSegment crops to — everything outside
// that window stays hidden.
export function FlagOverview({
  flagUrl,
  focalX,
  focalY,
}: {
  flagUrl: string;
  focalX: number;
  focalY: number;
}) {
  const aspect = useFlagAspect(flagUrl);

  // Until the flag's shape is known, hold the crop box's footprint so the
  // panel doesn't jump when it arrives.
  if (aspect === undefined) {
    return <div style={{ width: FLAG_CROP_SIZE.width, height: FLAG_CROP_SIZE.height }} />;
  }

  const { fit, cropFraction } = flagGeometry(aspect);
  const origin = cropOrigin(focalX, focalY, cropFraction);
  const boxLeftPx = origin.x * fit.width;
  const boxTopPx = origin.y * fit.height;

  return (
    <div
      style={{
        position: "relative",
        width: fit.width,
        height: fit.height,
        backgroundColor: COLORS.mutedBorder,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: boxLeftPx,
          top: boxTopPx,
          width: cropFraction.x * fit.width,
          height: cropFraction.y * fit.height,
          overflow: "hidden",
          border: `2px solid ${HIGHLIGHT_COLOR}`,
          boxSizing: "border-box",
        }}
      >
        <img
          src={flagUrl}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: "absolute",
            width: fit.width,
            height: fit.height,
            maxWidth: "none",
            left: -boxLeftPx,
            top: -boxTopPx,
            userSelect: "none",
            WebkitUserDrag: "none",
          } as CSSProperties}
        />
      </div>
    </div>
  );
}
