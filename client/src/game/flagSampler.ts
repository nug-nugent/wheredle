// Picks a focal point for the flag-segment crop, retrying until the cropped
// region isn't just blank/near-white — an all-white crop gives the player
// nothing to go on.
//
// The randomness is supplied by the caller rather than taken from
// Math.random, so a day's crop is the same one for everyone: two players
// comparing a shared grid should have been looking at the same picture.

const WHITE_THRESHOLD = 245;
const MAX_ATTEMPTS = 25;

interface FlagSample {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

const sampleCache = new Map<string, Promise<FlagSample>>();

function loadFlagSample(url: string): Promise<FlagSample> {
  const cached = sampleCache.get(url);
  if (cached) return cached;

  const promise = new Promise<FlagSample>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("2D canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({ width: canvas.width, height: canvas.height, data });
    };
    img.onerror = () => reject(new Error(`Failed to load flag image: ${url}`));
    img.src = url;
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
  zoom: number,
  random: () => number
): Promise<{ focalX: number; focalY: number }> {
  let sample: FlagSample;
  try {
    sample = await loadFlagSample(flagUrl);
  } catch {
    return randomPoint(random);
  }

  const cropWFrac = 1 / zoom;
  const cropHFrac = 1 / zoom;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { focalX, focalY } = randomPoint(random);
    const x0 = (focalX / 100) * (1 - cropWFrac) * sample.width;
    const y0 = (focalY / 100) * (1 - cropHFrac) * sample.height;
    const w = cropWFrac * sample.width;
    const h = cropHFrac * sample.height;
    if (!isBlank(sample, x0, y0, w, h)) {
      return { focalX, focalY };
    }
  }

  return randomPoint(random);
}
