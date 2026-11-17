import { NextResponse } from 'next/server';
import {
  CATEGORIES,
  COLORS,
  MALE_CATEGORIES,
  FEMALE_CATEGORIES,
  OCCASIONS,
  SEASONS,
  resolveColorName,
} from '@/lib/constants';
import type { AutoTagResult, Category, Color, Gender, Occasion, Season } from '@/types';

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

  const exact = list.find((item) => item.toLowerCase() === lower);
  if (exact) return exact;

  // Prefer longer labels so "T-Shirt" wins over "Shirt", "All-Season" over "Season".
  const byLength = [...list].sort((a, b) => b.length - a.length);
  const partial = byLength.find(
    (item) =>
      lower.includes(item.toLowerCase()) ||
      item.toLowerCase().includes(lower),
  );
  if (partial) return partial;

  const normalized = lower.replace(/[-\s]/g, '');
  return byLength.find(
    (item) => item.toLowerCase().replace(/[-\s]/g, '') === normalized,
  );
}

function cleanTitle(raw: unknown, color?: Color, category?: Category): string | undefined {
  if (typeof raw !== 'string') return undefined;
  let title = raw
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  if (!title) return undefined;

  // Drop leading "a/an/the"
  title = title.replace(/^(a|an|the)\s+/i, '');

  // Title-case words
  title = title
    .split(' ')
    .map((word) => {
      if (!word) return word;
      if (word === word.toUpperCase() && word.length <= 4) return word; // keep OK, XL
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // If title is too generic, rebuild from color + category.
  const generic = /^(top|item|clothes?|garment|piece|clothing)$/i;
  if (generic.test(title) && color && category) {
    return `${color} ${category}`;
  }

  return title;
}

function sanitize(result: AutoTagResult): AutoTagResult {
  const category = fuzzyMatch(result.category, CATEGORIES as readonly Category[]);
  const color = resolveColorName(result.color);
  const season = fuzzyMatch(result.season, SEASONS as readonly Season[]);
  const occasions = Array.isArray(result.occasions)
    ? result.occasions
        .map((v) => fuzzyMatch(v, OCCASIONS as readonly Occasion[]))
        .filter((v): v is Occasion => v !== undefined)
    : undefined;

  return {
    title: cleanTitle(result.title, color, category),
    category,
    color,
    season,
    occasions: occasions?.length ? occasions : undefined,
    brand: typeof result.brand === 'string' ? result.brand.slice(0, 60) : undefined,
  };
}

function taggingPrompt(gender: Gender | null) {
  const categories =
    gender === 'male'
      ? MALE_CATEGORIES
      : gender === 'female'
        ? FEMALE_CATEGORIES
        : CATEGORIES;

  const genderHint =
    gender === 'male'
      ? `This is a MEN'S garment. Use men's category names:
- A button-up shirt → "Shirt"
- A round/polo neck → "T-Shirt"  
- Denim pants → "Jeans"
- Formal pants/chinos → "Trousers"
- A coat/jacket → "Jacket"
- A formal suit → "Suit"
- A kurta/sherwani → "Ethnic"
- A sweatshirt with hood → "Hoodie"
- A formal jacket → "Blazer"
- Half pants → "Shorts"`
      : gender === 'female'
        ? `This is a WOMEN'S garment. Use women's category names carefully:
- Draped six-yard / pallu / border saree fabric (even if worn with a blouse) → "Saree" (NOT "Top")
- Blouse/crop/tank alone with no saree drape → "Top"
- Skirt/pants/leggings → "Bottom"
- Dress/jumpsuit → "One-Piece"
- Kurti/salwar → "Kurti"
- Corset/bustier → "Corset"
- Cardigan/shrug → "Layer"`
        : `If the photo shows a draped saree / pallu / saree border (with or without blouse), category MUST be "Saree", not "Top".`;

  return `You are a fashion cataloger for a digital wardrobe. Tag ONLY the clothing, not the scene.

${genderHint}

PERSON / SCENE PHOTOS:
- Someone may be wearing the garment outdoors. IGNORE skin, hair, jewelry, phone, dirt/ground, trees, and shadows.
- Identify the garment type from how it is worn/draped, not just the neckline.

CATEGORY pitfalls:
- Black saree with gold border embroidery + sleeveless blouse → category "Saree", NOT "Top"
- Do not call a saree a "Top" just because a blouse is visible.

COLOR — pick ONE from ${JSON.stringify(COLORS)}.
Use the BASE CLOTH color that covers most of the garment area.
CRITICAL:
- Embroidery, zari, borders, sequins, piping, and buttons are ACCENTS — do NOT use them as the main color.
  Example: black saree with heavy gold/beige embroidery → color "Black" (NOT Brown / Gold / Beige)
- Ignore warm sunlight on black fabric (it can look brownish) — if the cloth is black, choose Black.
- Ignore brown ground / gravel / leaves behind the person.
Shade map:
- Burgundy / wine / dark red → Maroon
- Midnight / dark navy → Navy
- Olive / army green → Olive
- Charcoal / gray → Grey
- Off-white / ivory → Cream
- Only use Multicolor when the body of the garment is a true multi-color print (not just trim)

TITLE — 2–5 words: "{Color} {optional detail} {garment noun}"
Examples:
- "Black Saree with Gold Border"
- "Maroon Cotton Kurti"
- "Navy Slim Fit Shirt"
Rules:
- Same color word as the "color" field
- If category is Saree, title must include "Saree"
- Do not invent brands; no quotes/emoji

JSON only:
{
  "title": "string",
  "category": one of ${JSON.stringify(categories)},
  "color": one of ${JSON.stringify(COLORS)},
  "occasions": array of 1-3 from ${JSON.stringify(OCCASIONS)},
  "season": one of ${JSON.stringify(SEASONS)},
  "brand": "visible brand or empty string"
}

occasions: for a formal/ethnic black saree prefer Festive / Wedding / Party as appropriate.
season: All-Season unless clearly seasonal fabric.`;
}

function parseDataUrl(image: string): { mime: string; data: string } | null {
  const match = image.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], data: match[2] };
}

async function tagWithGemini(image: string, gender: Gender | null): Promise<AutoTagResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const parsedImage = parseDataUrl(image);
  if (!parsedImage) {
    throw new Error('Image must be a data URL for Gemini');
  }

  // Prefer models verified working for this API key (2.0/2.5 flash are retired).
  const preferred = process.env.GEMINI_VISION_MODEL?.trim();
  const models = [
    preferred,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-3.7-flash',
    'gemini-3-flash-preview',
  ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

  let lastError = '';

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
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
                  { text: taggingPrompt(gender) },
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
              temperature: 0.05,
              maxOutputTokens: 400,
              responseMimeType: 'application/json',
            },
          }),
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        lastError = `Gemini ${model}: HTTP ${response.status} ${body.slice(0, 240)}`;
        // Transient / unavailable / retired → try next model.
        if (
          response.status === 400 ||
          response.status === 404 ||
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503
        ) {
          continue;
        }
        throw new Error(lastError);
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          finishReason?: string;
          content?: { parts?: Array<{ text?: string }> };
        }>;
        promptFeedback?: { blockReason?: string };
      };

      if (payload.promptFeedback?.blockReason) {
        lastError = `Gemini ${model}: blocked (${payload.promptFeedback.blockReason})`;
        continue;
      }

      const candidate = payload.candidates?.[0];
      const content = candidate?.content?.parts?.[0]?.text ?? '';
      const parsed = parseJsonLoose(content);
      if (parsed) return parsed;

      lastError = `Gemini ${model}: empty/unparseable (${candidate?.finishReason ?? 'no candidate'})`;
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = `Gemini ${model}: timed out`;
        continue;
      }
      lastError = error instanceof Error ? error.message : String(error);
      if (
        /404|429|500|502|503|not found|no longer available|timed out|Server Unavailable/i.test(
          lastError,
        )
      ) {
        continue;
      }
      throw error instanceof Error ? error : new Error(lastError);
    }
  }

  throw new Error(lastError || 'All Gemini vision models failed');
}

async function tagWithOpenAI(image: string, gender: Gender | null): Promise<AutoTagResult | null> {
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
            { type: 'text', text: taggingPrompt(gender) },
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
    const body = (await request.json()) as { image?: string; gender?: string };
    if (!body.image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const gender: Gender | null =
      body.gender === 'male' || body.gender === 'female' ? body.gender : null;

    let parsed: AutoTagResult | null = null;
    let lastError = '';

    if (hasGemini) {
      try {
        parsed = await tagWithGemini(body.image, gender);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Gemini failed';
      }
    }

    if (!parsed && hasOpenAI) {
      try {
        parsed = await tagWithOpenAI(body.image, gender);
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
