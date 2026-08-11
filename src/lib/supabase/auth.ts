import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export async function requireUserId(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Please sign in to sync your wardrobe');
  }

  return data.user.id;
}
