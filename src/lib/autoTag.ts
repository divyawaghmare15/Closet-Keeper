import { detectDominantColor } from '@/lib/imageProcess';
import type { AutoTagResult, Category, Gender } from '@/types';

/** Resize a data-URL to max 512px on the longest side for fast API upload. */
function shrinkForApi(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 512;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        const scale = MAX / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Fast local tags only — no API round-trip. Prefer for bulk import. */
export async function autoTagFromImageLocal(
  imageUrl: string,
  fallbackTitle = '',
  gender: Gender | null = null,
): Promise<AutoTagResult> {
  const color = await detectDominantColor(imageUrl);
  const category: Category = gender === 'male' ? 'T-Shirt' : 'Top';
  const cleaned = fallbackTitle.trim();

  return {
    title: cleaned || `${color} ${category.toLowerCase()}`,
    category,
    color,
    occasions: ['Casual'],
    season: 'All-Season',
    brand: '',
  };
}

export async function autoTagFromImage(
  imageUrl: string,
  gender: Gender | null = null,
): Promise<AutoTagResult> {
  try {
    const small = await shrinkForApi(imageUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const response = await fetch('/api/auto-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: small, gender }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const payload = (await response.json()) as { tags?: AutoTagResult };
      if (payload.tags) return payload.tags;
    }
  } catch {
    // fall through to local heuristic
  }

  return autoTagFromImageLocal(imageUrl, '', gender);
}
