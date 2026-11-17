import type { Color } from '@/types';

const MAX_BYTES = 200_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read file'));
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Convert a remote or blob image URL into a data URL for ML / canvas processing. */
export async function toProcessableDataUrl(src: string): Promise<string> {
  if (!src) throw new Error('Missing image');
  if (src.startsWith('data:')) return src;

  const response = await fetch(src, { mode: 'cors' });
  if (!response.ok) {
    throw new Error('Could not load image for background removal');
  }
  const blob = await response.blob();
  return fileToDataUrl(
    new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' }),
  );
}

/** Paint transparent pixels white so JPEG export never turns them black. */
export async function flattenOnWhite(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Keep garment colors true after cutout: un-premultiply soft edges, then
 * gently clean alpha (avoid hard binarize — that causes salt-and-pepper noise).
 */
export async function hardenCutoutAlpha(
  dataUrl: string,
  softFloor = 18,
  softCeil = 236,
): Promise<string> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    let a = data[i + 3];
    if (a <= 0) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }

    if (a < 255) {
      const inv = 255 / a;
      data[i] = Math.min(255, Math.round(data[i] * inv));
      data[i + 1] = Math.min(255, Math.round(data[i + 1] * inv));
      data[i + 2] = Math.min(255, Math.round(data[i + 2] * inv));
    }

    if (a < softFloor) a = 0;
    else if (a > softCeil) a = 255;
    data[i + 3] = a;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export async function compressDataUrl(
  dataUrl: string,
  maxBytes = MAX_BYTES,
): Promise<string> {
  const image = await loadImage(dataUrl);
  const maxEdge = 1200;
  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
  let width = Math.max(1, Math.round(image.width * scale));
  let height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  let quality = 0.85;
  let result = dataUrl;

  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = width;
    canvas.height = height;
    // White base — JPEG has no alpha; clear pixels would otherwise become black
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    result = canvas.toDataURL('image/jpeg', quality);

    if (result.length * 0.75 <= maxBytes) break;

    if (quality > 0.5) quality -= 0.1;
    else {
      width = Math.max(320, Math.round(width * 0.85));
      height = Math.max(320, Math.round(height * 0.85));
    }
  }

  return result;
}

export async function cropDataUrl(
  dataUrl: string,
  crop: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.width));
  canvas.height = Math.max(1, Math.round(crop.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL('image/jpeg', 0.92);
}

/** Simple canvas fallback: punch out pixels similar to corner sample. */
export async function removeBackgroundCanvas(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  const sample = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]] as const;
  };

  const corners = [
    sample(2, 2),
    sample(width - 3, 2),
    sample(2, height - 3),
    sample(width - 3, height - 3),
  ];

  const avg = corners
    .reduce(
      (acc, [r, g, b]) => [acc[0] + r, acc[1] + g, acc[2] + b] as const,
      [0, 0, 0] as const,
    )
    .map((v) => v / corners.length) as [number, number, number];

  const threshold = 42;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - avg[0];
    const dg = data[i + 1] - avg[1];
    const db = data[i + 2] - avg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < threshold) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

export type RemoveBackgroundProgress = {
  phase: string;
  progress: number;
  message: string;
};

/**
 * Client-side ML via Transformers.js + BRIA RMBG-1.4 in a Web Worker.
 */
export async function removeBackgroundMl(
  dataUrl: string,
  onProgress?: (update: RemoveBackgroundProgress) => void,
): Promise<string> {
  const { removeBackgroundWithRmbg } = await import('@/lib/rmbg/rmbgClient');
  return removeBackgroundWithRmbg(dataUrl, {
    onProgress: onProgress
      ? (update) =>
          onProgress({
            phase: update.phase,
            progress: update.progress,
            message: update.message,
          })
      : undefined,
  });
}

/**
 * 1) Optional remove.bg API (REMOVE_BG_API_KEY)
 * 2) Transformers.js RMBG-1.4 Web Worker
 * 3) Canvas color-similarity heuristic
 */
export async function removeBackgroundSmart(
  dataUrl: string,
  onProgress?: (update: RemoveBackgroundProgress) => void,
): Promise<string> {
  try {
    onProgress?.({
      phase: 'loading-model',
      progress: 5,
      message: 'Trying cloud background removal…',
    });
    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { image?: string };
      if (payload.image) {
        onProgress?.({
          phase: 'complete',
          progress: 100,
          message: 'Background removed',
        });
        return payload.image;
      }
    }
  } catch {
    // fall through
  }

  try {
    return await removeBackgroundMl(dataUrl, onProgress);
  } catch {
    onProgress?.({
      phase: 'processing',
      progress: 50,
      message: 'Using simple canvas fallback…',
    });
    const fallback = await removeBackgroundCanvas(dataUrl);
    onProgress?.({
      phase: 'complete',
      progress: 100,
      message: 'Background removed (fallback)',
    });
    return fallback;
  }
}

/**
 * Soften the scene instead of a hard cutout: keep the subject sharp and
 * blur the detected background over a white base (avoids black JPEG holes).
 */
export async function softenBackground(dataUrl: string): Promise<string> {
  let cutout: string;
  try {
    cutout = await removeBackgroundSmart(dataUrl);
  } catch {
    return flattenOnWhite(dataUrl);
  }

  const original = await loadImage(dataUrl);
  const subject = await loadImage(cutout);
  const width = original.width;
  const height = original.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return flattenOnWhite(dataUrl);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Oversized draw so blur edges don't show dark/empty borders
  const blurPx = Math.max(14, Math.round(Math.min(width, height) * 0.035));
  const pad = blurPx * 2;
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(original, -pad, -pad, width + pad * 2, height + pad * 2);
  ctx.filter = 'none';

  // Soft white wash so the blur reads as studio backdrop, not muddy room
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(0, 0, width, height);

  ctx.drawImage(subject, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.92);
}

function isLikelySkin(r: number, g: number, b: number): boolean {
  return (
    r > 90 &&
    g > 35 &&
    b > 15 &&
    r > g &&
    r > b &&
    r - g > 12 &&
    g > b - 10 &&
    r < 250 &&
    g < 220
  );
}

function isLikelyFoliage(r: number, g: number, b: number): boolean {
  return g > r + 12 && g > b + 12 && g > 60;
}

function isAccentMetalOrZari(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const value = max / 255;
  if (value < 0.45 || sat < 0.15) return false;
  const d = max - min || 1;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  const hue = (h * 60 + 360) % 360;
  return hue >= 25 && hue <= 70 && value > 0.5;
}

function rgbToColor(r: number, g: number, b: number): Color {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const value = max / 255;

  if (sat < 0.14) {
    if (value > 0.88) return 'White';
    if (value > 0.72) return 'Cream';
    if (value < 0.22) return 'Black';
    if (value < 0.48) return 'Grey';
    return 'Silver';
  }

  const hue = (() => {
    const d = max - min || 1;
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  })();

  if (hue < 18 || hue >= 345) {
    if (value < 0.45) return 'Maroon';
    if (sat < 0.35 && value > 0.55) return 'Pink';
    return 'Red';
  }
  if (hue < 40) {
    if (value < 0.4) return 'Brown';
    return sat > 0.55 ? 'Orange' : 'Brown';
  }
  if (hue < 65) {
    if (sat < 0.35) return 'Beige';
    if (value > 0.55 && sat > 0.45) return 'Gold';
    return 'Yellow';
  }
  if (hue < 95) {
    if (sat < 0.4 || value < 0.45) return 'Olive';
    return 'Green';
  }
  if (hue < 160) {
    if (hue > 140 && sat > 0.35) return 'Teal';
    return 'Green';
  }
  if (hue < 200) return 'Teal';
  if (hue < 255) {
    if (value < 0.4) return 'Navy';
    return 'Blue';
  }
  if (hue < 290) return 'Purple';
  if (hue < 330) return 'Pink';
  if (value < 0.45) return 'Maroon';
  return 'Red';
}

/** Local heuristic auto-tag from dominant garment colors. */
export async function detectDominantColor(dataUrl: string): Promise<Color> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const size = 72;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'Multicolor';

  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const counts: Partial<Record<Color, number>> = {};
  let used = 0;
  let blackish = 0;

  for (let idx = 0; idx < data.length; idx += 4) {
    const alpha = data[idx + 3];
    if (alpha < 128) continue;

    const pixelIndex = idx / 4;
    const x = pixelIndex % size;
    const y = Math.floor(pixelIndex / size);

    // Mid garment band — skip face-heavy top & ground-heavy bottom.
    if (x < size * 0.15 || x > size * 0.85 || y < size * 0.22 || y > size * 0.78) {
      continue;
    }

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const brightness = (r + g + b) / 3;

    if (brightness > 248 || brightness < 8) continue;
    if (isLikelySkin(r, g, b)) continue;
    if (isLikelyFoliage(r, g, b)) continue;
    if (isAccentMetalOrZari(r, g, b)) continue;

    const color = rgbToColor(r, g, b);
    counts[color] = (counts[color] ?? 0) + 1;
    used += 1;
    if (color === 'Black' || color === 'Navy' || color === 'Grey') blackish += 1;
  }

  if (!used) return 'Multicolor';

  const entries = Object.entries(counts) as Array<[Color, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const [topColor, topCount] = entries[0];

  // Black saree + gold border: don't let accents/skin win as Brown.
  const brownFamily =
    topColor === 'Brown' || topColor === 'Beige' || topColor === 'Gold';
  if (brownFamily && blackish >= used * 0.22) {
    return 'Black';
  }

  if (topCount < used * 0.28) return 'Multicolor';
  return topColor;
}
