import { NextResponse } from 'next/server';
import { OCCASIONS, SEASONS } from '@/lib/constants';
import { generateOutfits } from '@/lib/matchingEngine';
import type {
  ClothingItem,
  Occasion,
  Outfit,
  OutfitCatalogItem,
  Season,
} from '@/types';

export const runtime = 'nodejs';

const GEMINI_MODELS = [
  process.env.GEMINI_TEXT_MODEL,
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
].filter(
  (value, index, list): value is string =>
    Boolean(value) && list.indexOf(value) === index,
);

type SuggestBody = {
  occasion?: string;
  season?: string;
  cleanOnly?: boolean;
  items?: OutfitCatalogItem[];
};

type AiOutfit = {
  title?: string;
  reason?: string;
  itemIds?: unknown;
};

function parseJsonLoose(text: string): { outfits?: AiOutfit[] } | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as { outfits?: AiOutfit[] };
  } catch {
    return null;
  }
}

function suggestionPrompt(
  occasion: Occasion,
  season: Season | 'Any',
  catalog: OutfitCatalogItem[],
) {
  return `You are a stylist for ClosetKeeper. Suggest 4 complete outfits using ONLY items from this closet.

Occasion: ${occasion}
Season: ${season}

Closet (JSON):
${JSON.stringify(catalog)}

Rules:
- Use only item ids from the list. Never invent items.
- Prefer isClean true. Skip in-wash pieces unless nothing else works.
- Core look: Top + Bottom, or Kurti + Bottom, or Corset + Bottom, or Saree / One-Piece alone.
- Then optionally add Layer, Footwear, or Accessory if they exist and match.
- Avoid color clashes: Red+Green, Red+Blue, Green+Blue. Neutrals (Black, White, Beige) pair with anything.
- Prefer items with daysSinceWorn null (never worn) or a high number.
- Each outfit 2–5 pieces (1 is ok for a saree/one-piece).
- Titles short. Reason one sentence, practical.

Reply with JSON only:
{"outfits":[{"title":"string","reason":"string","itemIds":["id"]}]}`;
}

async function suggestWithGemini(prompt: string): Promise<AiOutfit[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  let lastError = 'Gemini request failed';

  for (const model of GEMINI_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.65,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      lastError = `Gemini ${model}: ${await response.text()}`;
      continue;
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = parseJsonLoose(content);
    if (parsed?.outfits?.length) return parsed.outfits;
    lastError = `Gemini ${model} returned no outfits`;
  }

  throw new Error(lastError);
}

function catalogToItems(catalog: OutfitCatalogItem[]): ClothingItem[] {
  return catalog.map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: '',
    category: item.category,
    occasions: item.occasions,
    color: item.color,
    isClean: item.isClean,
    lastWornDate:
      item.daysSinceWorn === null
        ? null
        : new Date(Date.now() - item.daysSinceWorn * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    brand: item.brand,
    size: '',
    season: item.season,
    price: null,
    notes: '',
  }));
}

function sanitizeOutfits(
  raw: AiOutfit[],
  catalog: OutfitCatalogItem[],
  occasion: Occasion,
): Outfit[] {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const outfits: Outfit[] = [];

  for (const entry of raw) {
    const ids = Array.isArray(entry.itemIds)
      ? [...new Set(entry.itemIds.filter((id): id is string => typeof id === 'string'))]
      : [];
    const valid = ids.filter((id) => byId.has(id)).slice(0, 5);
    if (valid.length === 0) continue;

    const key = valid.slice().sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    const pieces = valid.map((id) => byId.get(id)!);
    const title =
      typeof entry.title === 'string' && entry.title.trim()
        ? entry.title.trim().slice(0, 80)
        : pieces.map((item) => item.title).slice(0, 2).join(' + ');
    const reason =
      typeof entry.reason === 'string' && entry.reason.trim()
        ? entry.reason.trim().slice(0, 180)
        : undefined;

    outfits.push({
      id: crypto.randomUUID(),
      title,
      occasion,
      items: catalogToItems(pieces),
      itemIds: valid,
      isFavorite: false,
      createdDate: new Date().toISOString(),
      reason,
    });

    if (outfits.length >= 4) break;
  }

  return outfits;
}

function fallbackOutfits(
  catalog: OutfitCatalogItem[],
  occasion: Occasion,
  season: Season | 'Any',
): Outfit[] {
  const asItems = catalogToItems(catalog);
  let generated = generateOutfits(asItems, occasion, {
    season,
    limit: 4,
    seed: Date.now(),
  });

  if (generated.length === 0) {
    generated = generateOutfits(
      asItems.map((item) => ({
        ...item,
        occasions: [...new Set([...item.occasions, occasion])],
      })),
      occasion,
      { season, limit: 4, seed: Date.now() },
    );
  }

  return generated.map((outfit) => ({
    ...outfit,
    reason:
      'Paired from your closet by occasion, color, and how long since you last wore each piece.',
  }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SuggestBody;
    const occasion = (OCCASIONS as string[]).includes(body.occasion ?? '')
      ? (body.occasion as Occasion)
      : 'Casual';
    const season =
      body.season === 'Any' ||
      (SEASONS as string[]).includes(body.season ?? '')
        ? ((body.season as Season | 'Any') ?? 'Any')
        : 'Any';

    const catalog = Array.isArray(body.items)
      ? body.items.filter(
          (item): item is OutfitCatalogItem =>
            Boolean(item && typeof item.id === 'string' && item.title),
        )
      : [];

    if (catalog.length === 0) {
      return NextResponse.json(
        { error: 'Add clothes to your closet first.' },
        { status: 400 },
      );
    }

    const pool = (body.cleanOnly === false
      ? catalog
      : catalog.filter((item) => item.isClean)
    ).slice(0, 80);

    if (pool.length === 0) {
      return NextResponse.json(
        { error: 'No clean pieces to style. Mark something clean, or turn off Clean only.' },
        { status: 400 },
      );
    }

    let source: 'ai' | 'rules' = 'rules';
    let outfits: Outfit[] = [];
    let detail = '';

    if (process.env.GEMINI_API_KEY) {
      try {
        const raw = await suggestWithGemini(
          suggestionPrompt(occasion, season, pool),
        );
        outfits = sanitizeOutfits(raw, pool, occasion);
        if (outfits.length > 0) source = 'ai';
      } catch (error) {
        detail = error instanceof Error ? error.message : 'Gemini failed';
      }
    }

    if (outfits.length === 0) {
      outfits = fallbackOutfits(pool, occasion, season);
      source = 'rules';
    }

    if (outfits.length === 0) {
      return NextResponse.json(
        {
          error:
            'Need at least a top and bottom, or a saree / one-piece, tagged for this occasion.',
          detail,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ outfits, source });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Could not suggest outfits',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
