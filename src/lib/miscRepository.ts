import type { MiscCard, MiscPiece } from '@/types';
import { normalizeMiscCard } from '@/lib/storageNormalize';
import {
  deleteLocalMiscCard,
  getLocalMiscCards,
  saveLocalMiscCard,
} from '@/lib/localLooks';
import { requireUserId } from '@/lib/supabase/auth';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

type MiscRow = {
  id: string;
  title: string;
  cover_image_url: string;
  notes: string;
  pieces: unknown;
  created_date: string;
  updated_date: string;
};

function extensionForMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

async function uploadDataUrl(
  userId: string,
  pathId: string,
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

  const path = `${userId}/misc/${pathId}.${extensionForMime(mime)}`;
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

async function uploadCardImages(userId: string, card: MiscCard): Promise<MiscCard> {
  const pieces: MiscPiece[] = [];
  for (const piece of card.pieces) {
    pieces.push({
      ...piece,
      imageUrl: await uploadDataUrl(userId, `${card.id}-${piece.id}`, piece.imageUrl),
    });
  }

  const coverSource = card.coverImageUrl || pieces[0]?.imageUrl || '';
  const coverImageUrl = coverSource
    ? await uploadDataUrl(userId, `${card.id}-cover`, coverSource)
    : '';

  return {
    ...card,
    pieces,
    coverImageUrl: coverImageUrl || pieces[0]?.imageUrl || '',
  };
}

function rowToCard(row: MiscRow): MiscCard | null {
  return normalizeMiscCard({
    id: row.id,
    title: row.title,
    coverImageUrl: row.cover_image_url ?? '',
    notes: row.notes ?? '',
    pieces: row.pieces ?? [],
    createdDate: row.created_date,
    updatedDate: row.updated_date ?? row.created_date,
  });
}

function cardToRow(card: MiscCard, userId: string) {
  return {
    id: card.id,
    user_id: userId,
    title: card.title,
    cover_image_url: card.coverImageUrl,
    notes: card.notes,
    pieces: card.pieces,
    created_date: card.createdDate,
    updated_date: card.updatedDate,
  };
}

export async function getMiscCards(): Promise<MiscCard[]> {
  if (!isSupabaseConfigured()) {
    return getLocalMiscCards();
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return getLocalMiscCards();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('misc_cards')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('updated_date', { ascending: false });

  if (error) {
    const missingTable =
      error.code === '42P01' ||
      error.code === 'PGRST205' ||
      /misc_cards/i.test(error.message);
    if (missingTable) return [];
    throw new Error(error.message);
  }

  return (data as MiscRow[])
    .map(rowToCard)
    .filter((card): card is MiscCard => card !== null);
}

export async function saveMiscCard(card: MiscCard): Promise<MiscCard> {
  const normalized = normalizeMiscCard({
    ...card,
    updatedDate: new Date().toISOString(),
  });
  if (!normalized) {
    throw new Error('Invalid misc card schema');
  }

  if (!isSupabaseConfigured()) {
    return saveLocalMiscCard(normalized);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;
  const toSave = await uploadCardImages(userId, normalized);

  const { data, error } = await supabase
    .from('misc_cards')
    .upsert(cardToRow(toSave, userId), { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return rowToCard(data as MiscRow) ?? toSave;
}

export async function deleteMiscCard(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return deleteLocalMiscCard(id);
  }

  const userId = await requireUserId();
  const supabase = getSupabaseBrowserClient()!;

  const { error, count } = await supabase
    .from('misc_cards')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export async function importLocalMiscCardsToCloud(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const local = getLocalMiscCards();
  if (local.length === 0) return 0;
  for (const card of local) {
    await saveMiscCard(card);
  }
  return local.length;
}
