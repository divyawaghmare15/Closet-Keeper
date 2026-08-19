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

export async function removeBackgroundMl(dataUrl: string): Promise<string> {
  const { removeBackground } = await import('@imgly/background-removal');
  const blob = await removeBackground(dataUrl, {
    output: { format: 'image/png', quality: 0.9 },
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Background removal failed'));
    };
    reader.onerror = () => reject(new Error('Background removal failed'));
    reader.readAsDataURL(blob as Blob);
  });
}

export async function removeBackgroundSmart(dataUrl: string): Promise<string> {
  try {
    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    });

    if (response.ok) {
      const payload = (await response.json()) as { image?: string };
      if (payload.image) return payload.image;
    }
  } catch {
    // fall through
  }

  try {
    return await removeBackgroundMl(dataUrl);
  } catch {
    return removeBackgroundCanvas(dataUrl);
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

function rgbToColor(r: number, g: number, b: number): Color {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const brightness = max / 255;

  if (sat < 0.18) {
    if (brightness > 0.85) return 'White';
    if (brightness < 0.25) return 'Black';
    return 'Beige';
  }

  const hue = (() => {
    const d = max - min || 1;
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  })();

  if (hue < 25 || hue >= 345) return 'Red';
  if (hue < 75) return sat > 0.35 && brightness > 0.45 ? 'Beige' : 'Beige';
  if (hue < 160) return 'Green';
  if (hue < 260) return 'Blue';
  if (hue < 320) return 'Red';
  return 'Multicolor';
}

/** Local heuristic auto-tag from dominant garment colors. */
export async function detectDominantColor(dataUrl: string): Promise<Color> {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'Multicolor';

  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Majority vote across pixels (more robust than averaging).
  const counts: Record<Color, number> = {
    Black: 0,
    White: 0,
    Beige: 0,
    Red: 0,
    Green: 0,
    Blue: 0,
    // The remaining colors exist in the app type, but this local heuristic
    // intentionally maps only to a small palette it can classify reliably.
    Brown: 0,
    Grey: 0,
    Navy: 0,
    Pink: 0,
    Purple: 0,
    Yellow: 0,
    Orange: 0,
    Maroon: 0,
    Cream: 0,
    Olive: 0,
    Teal: 0,
    Gold: 0,
    Silver: 0,
    Multicolor: 0,
  } as any;

  let used = 0;
  for (let idx = 0; idx < data.length; idx += 4) {
    const alpha = data[idx + 3];
    if (alpha < 128) continue;

    const pixelIndex = idx / 4;
    const x = pixelIndex % size;
    const y = Math.floor(pixelIndex / size);

    // Sample the center area (ignores edges where backgrounds dominate).
    if (x < size * 0.1 || x > size * 0.9 || y < size * 0.1 || y > size * 0.9) {
      continue;
    }

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    const brightness = (r + g + b) / 3;

    // Skip near-white / near-black pixels (often background).
    if (brightness > 245 || brightness < 12) continue;

    let color: Color = 'Multicolor';

    if (sat < 0.18) {
      if (brightness > 0.85 * 255) color = 'White';
      else if (brightness < 0.25 * 255) color = 'Black';
      else color = 'Beige';
    } else {
      const d = max - min || 1;
      let h = 0;
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      const hue = (h * 60 + 360) % 360;

      if (hue < 25 || hue >= 345) color = 'Red';
      else if (hue < 75) color = 'Beige';
      else if (hue < 160) color = 'Green';
      else if (hue < 260) color = 'Blue';
      else if (hue < 320) color = 'Red';
      else color = 'Multicolor';
    }

    counts[color] += 1;
    used += 1;
  }

  if (!used) return 'Multicolor';

  // Pick the top bucket; if it's weak, report multicolor.
  const entries = Object.entries(counts) as Array<[Color, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const [topColor, topCount] = entries[0];
  if (topCount < used * 0.35) return 'Multicolor';
  return topColor;
}
