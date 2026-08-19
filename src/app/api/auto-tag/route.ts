import { NextResponse } from 'next/server';
import { CATEGORIES, COLORS, OCCASIONS, SEASONS } from '@/lib/constants';
import type { AutoTagResult, Category, Color, Occasion, Season } from '@/types';

export const runtime = 'nodejs';

function parseJsonLoose(text: string): AutoTagResult | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as AutoTagResult;
  } catch {
    return null;
  }
}

function fuzzyMatch<T extends string>(value: unknown, list: readonly T[]): T | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const lower = value.trim().toLowerCase();

  // Exact match
  const exact = list.find((item) => item.toLowerCase() === lower);
  if (exact) return exact;

  // Partial match (e.g. "Navy Blue" → "Navy", "T Shirt" → "T-Shirt")
  const partial = list.find(
    (item) =>
      lower.includes(item.toLowerCase()) ||
      item.toLowerCase().includes(lower),
  );
  if (partial) return partial;

  // Normalize hyphens/spaces (e.g. "tshirt" → "T-Shirt", "all season" → "All-Season")
  const normalized = lower.replace(/[-\s]/g, '');
  const normalMatch = list.find(
    (item) => item.toLowerCase().replace(/[-\s]/g, '') === normalized,
  );
  if (normalMatch) return normalMatch;

  return undefined;
}

function sanitize(result: AutoTagResult): AutoTagResult {
  const category = fuzzyMatch(result.category, CATEGORIES as readonly Category[]);
  const color = fuzzyMatch(result.color, COLORS as readonly Color[]);
  const season = fuzzyMatch(result.season, SEASONS as readonly Season[]);
  const occasions = Array.isArray(result.occasions)
    ? result.occasions
        .map((v) => fuzzyMatch(v, OCCASIONS as readonly Occasion[]))
        .filter((v): v is Occasion => v !== undefined)
    : undefined;

  return {
    title: typeof result.title === 'string' ? result.title.slice(0, 80) : undefined,
    category,
    color,
    season,
    occasions: occasions?.length ? occasions : undefined,
    brand: typeof result.brand === 'string' ? result.brand.slice(0, 60) : undefined,
  };
}

function taggingPrompt() {
  return `You are a fashion expert analyzing a clothing photo. Look carefully at the garment and identify it accurately.

IMPORTANT:
- Look at the ACTUAL dominant color of the garment (not the background).
- Identify the correct category based on the garment type.
- Be precise — if it's blue, say Blue. If it's navy/dark blue, say Navy. If pink, say Pink. Don't confuse colors.

Reply with this exact JSON structure:
{
  "title": "short descriptive name (e.g. Navy Slim Fit Shirt)",
  "category": one of ${JSON.stringify(CATEGORIES)},
  "color": one of ${JSON.stringify(COLORS)},
  "occasions": array of 1-3 values from ${JSON.stringify(OCCASIONS)},
  "season": one of ${JSON.stringify(SEASONS)},
  "brand": "brand name if visible on the garment, else empty string"
}

Rules:
- For color: pick the DOMINANT color of the clothing fabric, ignoring buttons/zippers/background.
- For category: match the garment type to the closest option. A polo/t-shirt is "T-Shirt", a formal shirt is "Shirt", a dress is "One-Piece", etc.
- For occasions: pick what this item is suitable for (can be multiple).
- For season: "All-Season" if it works year-round.`;
}

function parseDataUrl(image: string): { mime: string; data: string } | null {
  const match = image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], data: match[2] };
}

async function tagWithGemini(image: string): Promise<AutoTagResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const parsedImage = parseDataUrl(image);
  if (!parsedImage) {
    throw new Error('Image must be a data URL for Gemini');
  }

  const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.0-flash';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: taggingPrompt() },
              {
                inline_data: {
                  mime_type: parsedImage.mime,
                  data: parsedImage.data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`Gemini ${model}: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseJsonLoose(content);
}

async function tagWithOpenAI(image: string): Promise<AutoTagResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: taggingPrompt() },
            { type: 'image_url', image_url: { url: image } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parseJsonLoose(payload.choices?.[0]?.message?.content ?? '');
}

export async function POST(request: Request) {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if (!hasGemini && !hasOpenAI) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY or OPENAI_API_KEY not configured' },
      { status: 501 },
    );
  }

  try {
    const body = (await request.json()) as { image?: string };
    if (!body.image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    let parsed: AutoTagResult | null = null;
    let lastError = '';

    if (hasGemini) {
      try {
        parsed = await tagWithGemini(body.image);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Gemini failed';
      }
    }

    if (!parsed && hasOpenAI) {
      try {
        parsed = await tagWithOpenAI(body.image);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'OpenAI failed';
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: 'Could not parse vision response', detail: lastError },
        { status: 502 },
      );
    }

    return NextResponse.json({ tags: sanitize(parsed) });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Auto-tag failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
