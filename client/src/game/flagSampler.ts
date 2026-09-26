// Picks a focal point for the flag-segment crop, retrying until the cropped
// region isn't just blank/near-white — an all-white crop gives the player
// nothing to go on.
//
// The randomness is supplied by the caller rather than taken from
// Math.random, so a day's crop is the same one for everyone: two players
// comparing a shared grid should have been looking at the same picture.

import { cropOrigin, flagGeometry } from "./flagLayout";

const WHITE_THRESHOLD = 245;
const MAX_ATTEMPTS = 25;

interface FlagSample {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const aspectCache = new Map<string, number>();
const sampleCache = new Map<string, Promise<FlagSample>>();

function loadFlagImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      aspectCache.set(url, img.naturalWidth / img.naturalHeight);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load flag image: ${url}`));
    img.src = url;
  });

  imageCache.set(url, promise);
  return promise;
}

// The flag's width over its height, if its image has already loaded — which
// it has by the time a crop has been picked, so a freshly revealed hint can
// lay itself out on its first render.
export function knownFlagAspect(url: string): number | undefined {
  return aspectCache.get(url);
}

export async function loadFlagAspect(url: string): Promise<number> {
  const img = await loadFlagImage(url);
  return img.naturalWidth / img.naturalHeight;
}

function loadFlagSample(url: string): Promise<FlagSample> {
  const cached = sampleCache.get(url);
  if (cached) return cached;

  const promise = loadFlagImage(url).then((img) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return { width: canvas.width, height: canvas.height, data };
  });

  sampleCache.set(url, promise);
  return promise;
}

function isBlank(sample: FlagSample, x0: number, y0: number, w: number, h: number): boolean {
  const step = Math.max(1, Math.floor(Math.min(w, h) / 12));
  for (let y = y0; y < y0 + h; y += step) {
    for (let x = x0; x < x0 + w; x += step) {
      const i = (Math.floor(y) * sample.width + Math.floor(x)) * 4;
      const r = sample.data[i];
      const g = sample.data[i + 1];
      const b = sample.data[i + 2];
      const a = sample.data[i + 3];
      if (a > 10 && (r < WHITE_THRESHOLD || g < WHITE_THRESHOLD || b < WHITE_THRESHOLD)) {
        return false;
      }
    }
  }
  return true;
}

function randomPoint(random: () => number) {
  return { focalX: random() * 100, focalY: random() * 100 };
}

export async function pickFlagSegmentFocal(
  flagUrl: string,
  random: () => number
): Promise<{ focalX: number; focalY: number }> {
  let sample: FlagSample;
  try {
    sample = await loadFlagSample(flagUrl);
  } catch {
    return randomPoint(random);
  }

  // The crop covers a different share of each axis depending on the flag's
  // shape, so check exactly the region FlagSegment will show.
  const { cropFraction } = flagGeometry(sample.width / sample.height);
  const w = cropFraction.x * sample.width;
  const h = cropFraction.y * sample.height;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { focalX, focalY } = randomPoint(random);
    const origin = cropOrigin(focalX, focalY, cropFraction);
    if (!isBlank(sample, origin.x * sample.width, origin.y * sample.height, w, h)) {
      return { focalX, focalY };
    }
  }

  return randomPoint(random);
}
