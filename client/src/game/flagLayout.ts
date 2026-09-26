export const FLAG_CROP_SIZE = { width: 200, height: 120 };
export const FLAG_ZOOM = 4;

// Flags aren't all the crop box's 5:3 — the Philippines is 2:1,
// Switzerland square, Nepal taller than wide — and an SVG squeezed into a
// box of the wrong shape is letterboxed, not stretched. So the flag is laid
// out at its own aspect ratio, fitted inside the crop box the way the full
// flag hint fits it, and every crop is worked out against that rectangle.
// The sampler and both components share this so they agree on where the
// flag actually is.
export function flagGeometry(aspect: number) {
  const fitWidth = Math.min(FLAG_CROP_SIZE.width, FLAG_CROP_SIZE.height * aspect);
  const fitHeight = fitWidth / aspect;
  const zoomedWidth = fitWidth * FLAG_ZOOM;
  const zoomedHeight = fitHeight * FLAG_ZOOM;
  return {
    // The whole flag, as FlagOverview draws it.
    fit: { width: fitWidth, height: fitHeight },
    // The whole flag, as FlagSegment draws it before cropping.
    zoomed: { width: zoomedWidth, height: zoomedHeight },
    // How much of the flag the crop box covers along each axis.
    cropFraction: {
      x: Math.min(1, FLAG_CROP_SIZE.width / zoomedWidth),
      y: Math.min(1, FLAG_CROP_SIZE.height / zoomedHeight),
    },
  };
}

// The crop's top-left corner as a fraction of the flag, for a focal point
// given in 0–100 percentages.
export function cropOrigin(focalX: number, focalY: number, cropFraction: { x: number; y: number }) {
  return {
    x: (focalX / 100) * (1 - cropFraction.x),
    y: (focalY / 100) * (1 - cropFraction.y),
  };
}
