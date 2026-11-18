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
