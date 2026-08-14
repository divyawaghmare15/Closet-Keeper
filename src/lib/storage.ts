import type { ClothingItem, Outfit } from '@/types';
import { resolveOutfitItems } from '@/lib/localLooks';
import {
  deleteCapsule,
  getCapsules,
  importLocalCapsulesToCloud,
  saveCapsule,
} from '@/lib/capsulesRepository';
import {
  deleteMiscCard,
  getMiscCards,
  importLocalMiscCardsToCloud,
  saveMiscCard,
} from '@/lib/miscRepository';
import {
  deleteItem,
  getItems,
  importLocalItemsToCloud,
  markItemsWorn,
  saveItem,
  saveItems,
  toggleCleanStatus,
  usesCloudWardrobe,
} from '@/lib/itemsRepository';
import {
  deleteOutfit,
  getSavedOutfits,
  importLocalOutfitsToCloud,
  saveOutfit,
  toggleOutfitFavorite,
} from '@/lib/outfitsRepository';

export { resolveOutfitItems };

export {
  deleteItem,
  getItems,
  markItemsWorn,
  saveItem,
  saveItems,
  toggleCleanStatus,
  usesCloudWardrobe,
  importLocalItemsToCloud,
};

export {
  getSavedOutfits,
  saveOutfit,
  deleteOutfit,
  toggleOutfitFavorite,
  importLocalOutfitsToCloud,
};

export {
  getCapsules,
  saveCapsule,
  deleteCapsule,
  importLocalCapsulesToCloud,
};

export {
  getMiscCards,
  saveMiscCard,
  deleteMiscCard,
  importLocalMiscCardsToCloud,
};

export type LocalImportResult = {
  items: number;
  outfits: number;
  capsules: number;
  miscCards: number;
};

/** Push all local browser data into the signed-in cloud account. */
export async function importAllLocalToCloud(): Promise<LocalImportResult> {
  const [items, outfits, capsules, miscCards] = await Promise.all([
    importLocalItemsToCloud(),
    importLocalOutfitsToCloud(),
    importLocalCapsulesToCloud(),
    importLocalMiscCardsToCloud(),
  ]);

  return { items, outfits, capsules, miscCards };
}

export type { ClothingItem, Outfit };
