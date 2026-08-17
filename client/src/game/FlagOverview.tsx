import { FLAG_CROP_SIZE, FLAG_ZOOM } from "./flagLayout";

const HIGHLIGHT_COLOR = "var(--mantine-color-blue-6)";

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
  const boxSizePct = 100 / FLAG_ZOOM;
  const boxLeftPct = focalX * (1 - 1 / FLAG_ZOOM);
  const boxTopPct = focalY * (1 - 1 / FLAG_ZOOM);
  const boxLeftPx = (boxLeftPct / 100) * FLAG_CROP_SIZE.width;
  const boxTopPx = (boxTopPct / 100) * FLAG_CROP_SIZE.height;

  return (
    <div
      style={{
        position: "relative",
        width: FLAG_CROP_SIZE.width,
        height: FLAG_CROP_SIZE.height,
        borderRadius: 8,
        backgroundColor: "var(--mantine-color-gray-4)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${boxLeftPct}%`,
          top: `${boxTopPct}%`,
          width: `${boxSizePct}%`,
          height: `${boxSizePct}%`,
          overflow: "hidden",
          border: `2px solid ${HIGHLIGHT_COLOR}`,
          boxSizing: "border-box",
        }}
      >
        <img
          src={flagUrl}
          alt=""
          style={{
            position: "absolute",
            width: FLAG_CROP_SIZE.width,
            height: FLAG_CROP_SIZE.height,
            maxWidth: "none",
            left: -boxLeftPx,
            top: -boxTopPx,
          }}
        />
      </div>
    </div>
  );
}
