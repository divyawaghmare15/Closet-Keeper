import type {
  Capsule,
  Category,
  ClothingItem,
  Color,
  MiscCard,
  MiscPiece,
  Occasion,
  Outfit,
  Season,
  Size,
} from '@/types';
import { CATEGORIES, COLORS, OCCASIONS, SEASONS, SIZES } from '@/lib/constants';

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

export function isOccasion(value: unknown): value is Occasion {
  return typeof value === 'string' && (OCCASIONS as readonly string[]).includes(value);
}

export function isColor(value: unknown): value is Color {
  return typeof value === 'string' && (COLORS as readonly string[]).includes(value);
}

export function isSeason(value: unknown): value is Season {
  return typeof value === 'string' && (SEASONS as readonly string[]).includes(value);
}

export function isSize(value: unknown): value is Size {
  return typeof value === 'string' && (SIZES as readonly string[]).includes(value);
}

export function normalizeItem(value: unknown): ClothingItem | null {
  if (typeof value !== 'object' || value === null) return null;

  const item = value as Record<string, unknown>;

  if (
    typeof item.id !== 'string' ||
    typeof item.title !== 'string' ||
    typeof item.imageUrl !== 'string' ||
    !isCategory(item.category) ||
    !Array.isArray(item.occasions) ||
    !item.occasions.every(isOccasion) ||
    !isColor(item.color) ||
    typeof item.isClean !== 'boolean' ||
    (item.lastWornDate !== null && typeof item.lastWornDate !== 'string') ||
    typeof item.createdAt !== 'string'
  ) {
    return null;
  }

  const price =
    typeof item.price === 'number' && Number.isFinite(item.price)
      ? item.price
      : null;

  return {
    id: item.id,
    title: item.title,
    imageUrl: item.imageUrl,
    category: item.category,
    occasions: item.occasions,
    color: item.color,
    isClean: item.isClean,
    lastWornDate: item.lastWornDate as string | null,
    createdAt: item.createdAt,
    brand: typeof item.brand === 'string' ? item.brand : '',
    size: isSize(item.size) ? item.size : '',
    season: isSeason(item.season) ? item.season : 'All-Season',
    price,
    notes: typeof item.notes === 'string' ? item.notes : '',
  };
}

export function normalizeOutfit(value: unknown): Outfit | null {
  if (typeof value !== 'object' || value === null) return null;
  const outfit = value as Record<string, unknown>;

  if (
    typeof outfit.id !== 'string' ||
    typeof outfit.title !== 'string' ||
    !isOccasion(outfit.occasion) ||
    typeof outfit.isFavorite !== 'boolean' ||
    typeof outfit.createdDate !== 'string'
  ) {
    return null;
  }

  const itemIds = Array.isArray(outfit.itemIds)
    ? outfit.itemIds.filter((id): id is string => typeof id === 'string')
    : Array.isArray(outfit.items)
      ? (outfit.items as unknown[])
          .map((entry) =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof (entry as { id?: unknown }).id === 'string'
              ? (entry as { id: string }).id
              : null,
          )
          .filter((id): id is string => id !== null)
      : [];

  const items = Array.isArray(outfit.items)
    ? (outfit.items as unknown[])
        .map(normalizeItem)
        .filter((item): item is ClothingItem => item !== null)
    : [];

  return {
    id: outfit.id,
    title: outfit.title,
    occasion: outfit.occasion,
    itemIds,
    items,
    isFavorite: outfit.isFavorite,
    createdDate: outfit.createdDate,
    matchScore:
      typeof outfit.matchScore === 'number' ? outfit.matchScore : undefined,
    reason: typeof outfit.reason === 'string' ? outfit.reason : undefined,
  };
}

export function normalizeCapsule(value: unknown): Capsule | null {
  if (typeof value !== 'object' || value === null) return null;
  const capsule = value as Record<string, unknown>;

  if (
    typeof capsule.id !== 'string' ||
    typeof capsule.title !== 'string' ||
    !Array.isArray(capsule.occasions) ||
    !capsule.occasions.every(isOccasion) ||
    !isSeason(capsule.season) ||
    !Array.isArray(capsule.itemIds) ||
    !capsule.itemIds.every((id) => typeof id === 'string') ||
    typeof capsule.targetCount !== 'number' ||
    typeof capsule.createdDate !== 'string'
  ) {
    return null;
  }

  return {
    id: capsule.id,
    title: capsule.title,
    occasions: capsule.occasions,
    season: capsule.season,
    itemIds: capsule.itemIds,
    targetCount: capsule.targetCount,
    notes: typeof capsule.notes === 'string' ? capsule.notes : '',
    createdDate: capsule.createdDate,
  };
}

export function normalizeMiscPiece(value: unknown): MiscPiece | null {
  if (typeof value !== 'object' || value === null) return null;
  const piece = value as Record<string, unknown>;

  if (
    typeof piece.id !== 'string' ||
    typeof piece.title !== 'string' ||
    typeof piece.imageUrl !== 'string'
  ) {
    return null;
  }

  const quantity =
    typeof piece.quantity === 'number' &&
    Number.isFinite(piece.quantity) &&
    piece.quantity > 0
      ? Math.round(piece.quantity)
      : 1;

  return {
    id: piece.id,
    title: piece.title,
    imageUrl: piece.imageUrl,
    notes: typeof piece.notes === 'string' ? piece.notes : '',
    quantity,
  };
}

export function normalizeMiscCard(value: unknown): MiscCard | null {
  if (typeof value !== 'object' || value === null) return null;
  const card = value as Record<string, unknown>;

  if (
    typeof card.id !== 'string' ||
    typeof card.title !== 'string' ||
    typeof card.createdDate !== 'string'
  ) {
    return null;
  }

  const pieces = Array.isArray(card.pieces)
    ? card.pieces
        .map(normalizeMiscPiece)
        .filter((piece): piece is MiscPiece => piece !== null)
    : [];

  const coverImageUrl =
    typeof card.coverImageUrl === 'string' ? card.coverImageUrl : '';

  return {
    id: card.id,
    title: card.title,
    coverImageUrl,
    notes: typeof card.notes === 'string' ? card.notes : '',
    pieces,
    createdDate: card.createdDate,
    updatedDate:
      typeof card.updatedDate === 'string' ? card.updatedDate : card.createdDate,
  };
}
