import type { CSSProperties } from "react";
import { COLORS } from "../theme";
import { FLAG_CROP_SIZE, cropOrigin, flagGeometry } from "./flagLayout";
import { useFlagAspect } from "./useFlagAspect";

export function FlagSegment({
  flagUrl,
  focalX,
  focalY,
}: {
  flagUrl: string;
  focalX: number;
  focalY: number;
}) {
  const aspect = useFlagAspect(flagUrl);

  return (
    <div
      style={{
        width: FLAG_CROP_SIZE.width,
        height: FLAG_CROP_SIZE.height,
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {aspect !== undefined && <CroppedFlag flagUrl={flagUrl} focalX={focalX} focalY={focalY} aspect={aspect} />}
    </div>
  );
}

function CroppedFlag({
  flagUrl,
  focalX,
  focalY,
  aspect,
}: {
  flagUrl: string;
  focalX: number;
  focalY: number;
  aspect: number;
}) {
  const { zoomed, cropFraction } = flagGeometry(aspect);
  const origin = cropOrigin(focalX, focalY, cropFraction);

  return (
    <img
      src={flagUrl}
      alt=""
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: zoomed.width,
        height: zoomed.height,
        maxWidth: "none",
        position: "relative",
        left: -origin.x * zoomed.width,
        top: -origin.y * zoomed.height,
        userSelect: "none",
        WebkitUserDrag: "none",
      } as CSSProperties}
    />
  );
}
