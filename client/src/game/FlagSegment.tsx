import type { CSSProperties } from "react";
import { COLORS } from "../theme";
import { FLAG_CROP_SIZE, FLAG_ZOOM } from "./flagLayout";

export function FlagSegment({
  flagUrl,
  focalX,
  focalY,
}: {
  flagUrl: string;
  focalX: number;
  focalY: number;
}) {
  const scaledWidth = FLAG_CROP_SIZE.width * FLAG_ZOOM;
  const scaledHeight = FLAG_CROP_SIZE.height * FLAG_ZOOM;

  return (
    <div
      style={{
        width: FLAG_CROP_SIZE.width,
        height: FLAG_CROP_SIZE.height,
        overflow: "hidden",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <img
        src={flagUrl}
        alt=""
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          width: scaledWidth,
          height: scaledHeight,
          maxWidth: "none",
          position: "relative",
          left: `-${(focalX / 100) * (scaledWidth - FLAG_CROP_SIZE.width)}px`,
          top: `-${(focalY / 100) * (scaledHeight - FLAG_CROP_SIZE.height)}px`,
          userSelect: "none",
          WebkitUserDrag: "none",
        } as CSSProperties}
      />
    </div>
  );
}
