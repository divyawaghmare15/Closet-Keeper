import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Proxies to remove.bg when REMOVE_BG_API_KEY is configured.
 * Without a key, returns 501 so the client falls back to on-device ML / canvas.
 */
export async function POST(request: Request) {
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'REMOVE_BG_API_KEY not configured' },
      { status: 501 },
    );
  }

  try {
    const body = (await request.json()) as { image?: string };
    if (!body.image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const base64 = body.image.replace(/^data:image\/\w+;base64,/, '');
    const form = new FormData();
    form.append('size', 'auto');
    form.append('image_file_b64', base64);

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: 'remove.bg failed', detail: text },
        { status: 502 },
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const image = `data:image/png;base64,${buffer.toString('base64')}`;
    return NextResponse.json({ image });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Background removal failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
