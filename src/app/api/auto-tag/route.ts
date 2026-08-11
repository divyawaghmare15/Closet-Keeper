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

function sanitize(result: AutoTagResult): AutoTagResult {
  const category =
    result.category && (CATEGORIES as string[]).includes(result.category)
      ? (result.category as Category)
      : undefined;
  const color =
    result.color && (COLORS as string[]).includes(result.color)
      ? (result.color as Color)
      : undefined;
  const season =
    result.season && (SEASONS as string[]).includes(result.season)
      ? (result.season as Season)
      : undefined;
  const occasions = Array.isArray(result.occasions)
    ? result.occasions.filter((value): value is Occasion =>
        (OCCASIONS as string[]).includes(value),
      )
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

/**
 * Vision auto-tag via OpenAI when OPENAI_API_KEY is set.
 * Without a key, returns 501 for client-side heuristic fallback.
 */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY not configured' },
      { status: 501 },
    );
  }

  try {
    const body = (await request.json()) as { image?: string };
    if (!body.image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const prompt = `Identify the clothing item in this photo. Reply with JSON only:
{
  "title": "short descriptive name",
  "category": one of ${JSON.stringify(CATEGORIES)},
  "color": one of ${JSON.stringify(COLORS)},
  "occasions": array from ${JSON.stringify(OCCASIONS)},
  "season": one of ${JSON.stringify(SEASONS)},
  "brand": "brand if visible else empty string"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: body.image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: 'Vision API failed', detail },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonLoose(content);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Could not parse vision response' },
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
