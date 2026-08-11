import type { ClothingItem, Outfit } from '@/types';
import { normalizeItem, normalizeOutfit } from '@/lib/storageNormalize';
import {
  deleteLocalOutfit,
  getLocalOutfits,
  saveLocalOutfit,
  toggleLocalOutfitFavorite,
} from '@/lib/localLooks';
import { requireUserId } from '@/lib/supabase/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type OutfitRow = {
  id: string;
  title: string;
  occasion: string;
  item_ids: string[];
  items_snapshot: unknown;
  is_favorite: boolean;
  match_score: number | string | null;
  created_date: string;
};

function snapshotToItems(snapshot: unknown): ClothingItem[] {
  if (!Array.isArray(snapshot)) return [];
  return snapshot
    .map(normalizeItem)
    .filter((item): item is ClothingItem => item !== null);
}

function rowToOutfit(row: OutfitRow): Outfit | null {
  const items = snapshotToItems(row.items_snapshot);
  return normalizeOutfit({
    id: row.id,
    title: row.title,
    occasion: row.occasion,
    itemIds: row.item_ids ?? [],
    items,
    isFavorite: row.is_favorite,
    createdDate: row.created_date,
    matchScore:
      row.match_score === null || row.match_score === undefined
        ? undefined
        : Number(row.match_score),
  });
}

function outfitToRow(outfit: Outfit, userId: string) {
  const itemIds = outfit.itemIds.length
    ? outfit.itemIds
    : outfit.items.map((item) => item.id);

  return {
    id: outfit.id,
    user_id: userId,
    title: outfit.title,
    occasion: outfit.occasion,
    item_ids: itemIds,
    items_snapshot: outfit.items,
    is_favorite: outfit.isFavorite,
    match_score: outfit.matchScore ?? null,
    created_date: outfit.createdDate,
  };
}

export async function getSavedOutfits(): Promise<Outfit[]> {
  if (!isSupabaseConfigured()) {
    return getLocalOutfits();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return getLocalOutfits();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('saved_outfits')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_date', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as OutfitRow[])
    .map(rowToOutfit)
    .filter((outfit): outfit is Outfit => outfit !== null);
}

export async function saveOutfit(outfit: Outfit): Promise<Outfit> {
  const normalized = normalizeOutfit({
    ...outfit,
    itemIds: outfit.itemIds.length
      ? outfit.itemIds
      : outfit.items.map((item) => item.id),
    items: outfit.items,
    isFavorite: outfit.isFavorite ?? true,
  });
  if (!normalized) {
    throw new Error('Invalid outfit schema');
  }

  if (!isSupabaseConfigured()) {
    return saveLocalOutfit(normalized);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { data, error } = await supabase
    .from('saved_outfits')
    .upsert(outfitToRow(normalized, userId), { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToOutfit(data as OutfitRow) ?? normalized;
}

export async function deleteOutfit(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deleteLocalOutfit(id);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { error, count } = await supabase
    .from('saved_outfits')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function toggleOutfitFavorite(id: string): Promise<Outfit | null> {
  if (!isSupabaseConfigured()) {
    return toggleLocalOutfitFavorite(id);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { data: existing, error: readError } = await supabase
    .from('saved_outfits')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!existing) return null;

  const nextFavorite = !(existing as OutfitRow).is_favorite;
  const { data, error } = await supabase
    .from('saved_outfits')
    .update({ is_favorite: nextFavorite })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToOutfit(data as OutfitRow);
}

export async function importLocalOutfitsToCloud(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const local = getLocalOutfits();
  if (local.length === 0) return 0;
  for (const outfit of local) {
    await saveOutfit(outfit);
  }
  return local.length;
}
