import type { Capsule } from '@/types';
import { normalizeCapsule } from '@/lib/storageNormalize';
import {
  deleteLocalCapsule,
  getLocalCapsules,
  saveLocalCapsule,
} from '@/lib/localLooks';
import { requireUserId } from '@/lib/supabase/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type CapsuleRow = {
  id: string;
  title: string;
  occasions: string[];
  season: string;
  item_ids: string[];
  target_count: number;
  notes: string;
  created_date: string;
};

function rowToCapsule(row: CapsuleRow): Capsule | null {
  return normalizeCapsule({
    id: row.id,
    title: row.title,
    occasions: row.occasions,
    season: row.season,
    itemIds: row.item_ids ?? [],
    targetCount: row.target_count,
    notes: row.notes ?? '',
    createdDate: row.created_date,
  });
}

function capsuleToRow(capsule: Capsule, userId: string) {
  return {
    id: capsule.id,
    user_id: userId,
    title: capsule.title,
    occasions: capsule.occasions,
    season: capsule.season,
    item_ids: capsule.itemIds,
    target_count: capsule.targetCount,
    notes: capsule.notes,
    created_date: capsule.createdDate,
  };
}

export async function getCapsules(): Promise<Capsule[]> {
  if (!isSupabaseConfigured()) {
    return getLocalCapsules();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return getLocalCapsules();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('capsules')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_date', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as CapsuleRow[])
    .map(rowToCapsule)
    .filter((capsule): capsule is Capsule => capsule !== null);
}

export async function saveCapsule(capsule: Capsule): Promise<Capsule> {
  const normalized = normalizeCapsule(capsule);
  if (!normalized) {
    throw new Error('Invalid capsule schema');
  }

  if (!isSupabaseConfigured()) {
    return saveLocalCapsule(normalized);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { data, error } = await supabase
    .from('capsules')
    .upsert(capsuleToRow(normalized, userId), { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToCapsule(data as CapsuleRow) ?? normalized;
}

export async function deleteCapsule(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deleteLocalCapsule(id);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { error, count } = await supabase
    .from('capsules')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function importLocalCapsulesToCloud(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const local = getLocalCapsules();
  if (local.length === 0) return 0;
  for (const capsule of local) {
    await saveCapsule(capsule);
  }
  return local.length;
}
