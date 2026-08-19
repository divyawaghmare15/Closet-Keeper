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

function taggingPrompt() {
  return `Identify the clothing item in this photo. Reply with JSON only:
{
  "title": "short descriptive name",
  "category": one of ${JSON.stringify(CATEGORIES)},
  "color": one of ${JSON.stringify(COLORS)},
  "occasions": array from ${JSON.stringify(OCCASIONS)},
  "season": one of ${JSON.stringify(SEASONS)},
  "brand": "brand if visible else empty string"
}`;
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
          temperature: 0.2,
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
      temperature: 0.2,
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

/**
 * Vision auto-tag: Gemini (GEMINI_API_KEY) first, then OpenAI.
 * Without either key, returns 501 for client-side heuristic fallback.
 */
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
