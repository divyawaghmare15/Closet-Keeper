import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Lightweight ping so the Supabase free-tier project does not pause from inactivity.
 * Invoked by Vercel Cron (see vercel.json). Secured with CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase is not configured' },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase.from('capsules').select('id').limit(1);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        at: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Supabase keep-awake ping succeeded',
    at: new Date().toISOString(),
  });
}
