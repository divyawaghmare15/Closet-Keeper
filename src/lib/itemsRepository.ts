import type { ClothingItem } from '@/types';
import { normalizeItem } from '@/lib/storageNormalize';
import {
  deleteLocalItem,
  getLocalItems,
  markLocalItemsWorn,
  saveLocalItem,
  saveLocalItems,
  toggleLocalCleanStatus,
} from '@/lib/localItems';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type ClothingRow = {
  id: string;
  title: string;
  image_url: string;
  category: string;
  occasions: string[];
  color: string;
  is_clean: boolean;
  last_worn_date: string | null;
  created_at: string;
  brand: string;
  size: string;
  season: string;
  price: number | string | null;
  notes: string;
};

function rowToItem(row: ClothingRow): ClothingItem | null {
  return normalizeItem({
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    category: row.category,
    occasions: row.occasions,
    color: row.color,
    isClean: row.is_clean,
    lastWornDate: row.last_worn_date,
    createdAt: row.created_at,
    brand: row.brand,
    size: row.size,
    season: row.season,
    price:
      row.price === null || row.price === undefined
        ? null
        : Number(row.price),
    notes: row.notes,
  });
}

function itemToRow(item: ClothingItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    image_url: item.imageUrl,
    category: item.category,
    occasions: item.occasions,
    color: item.color,
    is_clean: item.isClean,
    last_worn_date: item.lastWornDate,
    created_at: item.createdAt,
    brand: item.brand,
    size: item.size,
    season: item.season,
    price: item.price,
    notes: item.notes,
  };
}

async function requireUserId(): Promise<string> {
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

function extensionForMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'jpg';
}

/** Upload data-URL images to Supabase Storage; leave http(s) URLs unchanged. */
async function ensureRemoteImageUrl(
  userId: string,
  itemId: string,
  imageUrl: string,
): Promise<string> {
  if (!imageUrl.startsWith('data:')) return imageUrl;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return imageUrl;

  const match = imageUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) return imageUrl;

  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const path = `${userId}/${itemId}.${extensionForMime(mime)}`;
  const { error } = await supabase.storage
    .from('clothing-images')
    .upload(path, bytes, {
      contentType: mime,
      upsert: true,
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('clothing-images').getPublicUrl(path);
  return data.publicUrl;
}

export function usesCloudWardrobe(): boolean {
  return isSupabaseConfigured();
}

export async function getItems(): Promise<ClothingItem[]> {
  if (!isSupabaseConfigured()) {
    return getLocalItems();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return getLocalItems();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClothingRow[])
    .map(rowToItem)
    .filter((item): item is ClothingItem => item !== null);
}

export async function saveItem(item: ClothingItem): Promise<ClothingItem> {
  const normalized = normalizeItem(item);
  if (!normalized) {
    throw new Error('Invalid clothing item schema');
  }

  if (!isSupabaseConfigured()) {
    return saveLocalItem(normalized);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;
  const imageUrl = await ensureRemoteImageUrl(
    userId,
    normalized.id,
    normalized.imageUrl,
  );
  const toSave = { ...normalized, imageUrl };

  const { data, error } = await supabase
    .from('clothing_items')
    .upsert(itemToRow(toSave, userId), { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToItem(data as ClothingRow) ?? toSave;
}

export async function saveItems(newItems: ClothingItem[]): Promise<ClothingItem[]> {
  if (!isSupabaseConfigured()) {
    return saveLocalItems(newItems);
  }

  const saved: ClothingItem[] = [];
  for (const item of newItems) {
    saved.push(await saveItem(item));
  }
  return saved;
}

export async function deleteItem(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deleteLocalItem(id);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { error, count } = await supabase
    .from('clothing_items')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  return (count ?? 0) > 0;
}

export async function toggleCleanStatus(
  id: string,
): Promise<ClothingItem | null> {
  if (!isSupabaseConfigured()) {
    return toggleLocalCleanStatus(id);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { data: existing, error: readError } = await supabase
    .from('clothing_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!existing) return null;

  const nextClean = !(existing as ClothingRow).is_clean;
  const { data, error } = await supabase
    .from('clothing_items')
    .update({ is_clean: nextClean })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToItem(data as ClothingRow);
}

export async function markItemsWorn(
  ids: string[],
  wornAt = new Date().toISOString(),
): Promise<void> {
  if (!isSupabaseConfigured()) {
    markLocalItemsWorn(ids, wornAt);
    return;
  }

  if (ids.length === 0) return;

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { error } = await supabase
    .from('clothing_items')
    .update({ last_worn_date: wornAt, is_clean: false })
    .in('id', ids)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

/** One-time helper: push browser localStorage items into the signed-in cloud closet. */
export async function importLocalItemsToCloud(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const local = getLocalItems();
  if (local.length === 0) return 0;

  await saveItems(local);
  return local.length;
}
