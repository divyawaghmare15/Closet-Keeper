import { detectDominantColor } from '@/lib/imageProcess';
import type { AutoTagResult, Category, Color, Gender } from '@/types';

const ACCENT_COLORS: Color[] = ['Brown', 'Beige', 'Gold', 'Cream', 'Orange'];

/** Resize a data-URL for vision API upload (keep enough detail for shade + garment type). */
function shrinkForApi(dataUrl: string, maxEdge = 768, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxEdge || height > maxEdge) {
        const scale = maxEdge / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function titleCaseColorCategory(color: Color, category: Category): string {
  return `${color} ${category}`;
}

/** Correct embroidery/skin misfires using local fabric histogram. */
async function refineTagsWithLocalColor(
  imageUrl: string,
  tags: AutoTagResult,
): Promise<AutoTagResult> {
  const localColor = await detectDominantColor(imageUrl);
  let color = tags.color ?? localColor;
  let title = tags.title;
  let category = tags.category;

  if (
    tags.color &&
    ACCENT_COLORS.includes(tags.color) &&
    (localColor === 'Black' || localColor === 'Navy' || localColor === 'Grey')
  ) {
    color = localColor;
  }

  // If title still says Brown/Beige but color was corrected, rewrite title prefix.
  if (title && color && ACCENT_COLORS.some((c) => title!.toLowerCase().startsWith(c.toLowerCase()))) {
    title = title.replace(/^\w+/, color);
  }

  if (!title && color && category) {
    title = titleCaseColorCategory(color, category);
  }

  return { ...tags, color, title, category };
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
    title: cleaned || titleCaseColorCategory(color, category),
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
  const attempts: Array<{ maxEdge: number; quality: number }> = [
    { maxEdge: 640, quality: 0.82 },
    { maxEdge: 480, quality: 0.75 },
  ];

  for (const attempt of attempts) {
    try {
      const small = await shrinkForApi(imageUrl, attempt.maxEdge, attempt.quality);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55_000);

      const response = await fetch('/api/auto-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: small, gender }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        const payload = (await response.json()) as { tags?: AutoTagResult };
        if (payload.tags) {
          return refineTagsWithLocalColor(imageUrl, payload.tags);
        }
      }
    } catch {
      // try next size / fall through
    }
  }

  return autoTagFromImageLocal(imageUrl, '', gender);
}
