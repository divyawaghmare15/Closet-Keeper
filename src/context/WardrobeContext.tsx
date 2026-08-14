'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  clearLocalItems,
  countLocalItems,
} from '@/lib/localItems';
import {
  clearLocalCapsules,
  clearLocalMiscCards,
  clearLocalOutfits,
  countLocalCapsules,
  countLocalMiscCards,
  countLocalOutfits,
} from '@/lib/localLooks';
import {
  deleteCapsule as deleteCapsuleFromStorage,
  deleteItem as deleteItemFromStorage,
  deleteMiscCard as deleteMiscCardFromStorage,
  deleteOutfit as deleteOutfitFromStorage,
  getCapsules,
  getItems,
  getMiscCards,
  getSavedOutfits,
  importAllLocalToCloud,
  markItemsWorn as markItemsWornInStorage,
  resolveOutfitItems,
  saveCapsule as saveCapsuleToStorage,
  saveItem as saveItemToStorage,
  saveItems as saveItemsToStorage,
  saveMiscCard as saveMiscCardToStorage,
  saveOutfit as saveOutfitToStorage,
  toggleCleanStatus as toggleCleanStatusInStorage,
  toggleOutfitFavorite as toggleOutfitFavoriteInStorage,
  usesCloudWardrobe,
  type LocalImportResult,
} from '@/lib/storage';
import type {
  Capsule,
  ClothingItem,
  FilterState,
  MiscCard,
  Outfit,
} from '@/types';

const DEFAULT_FILTERS: FilterState = {
  category: 'All',
  occasion: 'All',
  season: 'All',
  isCleanOnly: false,
  searchQuery: '',
};

interface WardrobeContextValue {
  items: ClothingItem[];
  savedOutfits: Outfit[];
  capsules: Capsule[];
  miscCards: MiscCard[];
  filters: FilterState;
  setFilters: (
    filters: FilterState | ((prev: FilterState) => FilterState),
  ) => void;
  loading: boolean;
  error: string;
  cloudEnabled: boolean;
  localItemCount: number;
  localOutfitCount: number;
  localCapsuleCount: number;
  localMiscCount: number;
  saveItem: (item: ClothingItem) => Promise<ClothingItem>;
  saveItems: (items: ClothingItem[]) => Promise<ClothingItem[]>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleCleanStatus: (id: string) => Promise<ClothingItem | null>;
  markItemsWorn: (ids: string[]) => Promise<void>;
  saveOutfit: (outfit: Outfit) => Promise<Outfit>;
  deleteOutfit: (id: string) => Promise<boolean>;
  toggleOutfitFavorite: (id: string) => Promise<Outfit | null>;
  saveCapsule: (capsule: Capsule) => Promise<Capsule>;
  deleteCapsule: (id: string) => Promise<boolean>;
  saveMiscCard: (card: MiscCard) => Promise<MiscCard>;
  deleteMiscCard: (id: string) => Promise<boolean>;
  importLocalToCloud: () => Promise<LocalImportResult>;
  filteredItems: ClothingItem[];
  resolveOutfit: (outfit: Outfit) => Outfit;
  refresh: () => Promise<void>;
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

function applyFilters(
  items: ClothingItem[],
  filters: FilterState,
): ClothingItem[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.category !== 'All' && item.category !== filters.category) {
      return false;
    }

    if (
      filters.occasion !== 'All' &&
      !item.occasions.includes(filters.occasion)
    ) {
      return false;
    }

    if (filters.season !== 'All' && item.season !== filters.season) {
      return false;
    }

    if (filters.isCleanOnly && !item.isClean) {
      return false;
    }

    if (query) {
      const haystack = [
        item.title,
        item.brand,
        item.notes,
        item.color,
        item.category,
        item.size,
        item.season,
        item.price != null ? String(item.price) : '',
        ...item.occasions,
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const { configured, user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [miscCards, setMiscCards] = useState<MiscCard[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localItemCount, setLocalItemCount] = useState(0);
  const [localOutfitCount, setLocalOutfitCount] = useState(0);
  const [localCapsuleCount, setLocalCapsuleCount] = useState(0);
  const [localMiscCount, setLocalMiscCount] = useState(0);

  const cloudEnabled = usesCloudWardrobe();

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [nextItems, nextOutfits, nextCapsules, nextMisc] = await Promise.all([
        getItems(),
        getSavedOutfits(),
        getCapsules(),
        getMiscCards(),
      ]);
      setItems(nextItems);
      setSavedOutfits(nextOutfits);
      setCapsules(nextCapsules);
      setMiscCards(nextMisc);
      setLocalItemCount(countLocalItems());
      setLocalOutfitCount(countLocalOutfits());
      setLocalCapsuleCount(countLocalCapsules());
      setLocalMiscCount(countLocalMiscCards());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wardrobe');
      setItems([]);
      setSavedOutfits([]);
      setCapsules([]);
      setMiscCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    void refresh();
  }, [authLoading, user?.id, configured, refresh]);

  async function saveItem(item: ClothingItem): Promise<ClothingItem> {
    const saved = await saveItemToStorage(item);
    await refresh();
    return saved;
  }

  async function saveItems(nextItems: ClothingItem[]): Promise<ClothingItem[]> {
    const saved = await saveItemsToStorage(nextItems);
    await refresh();
    return saved;
  }

  async function deleteItem(id: string): Promise<boolean> {
    const deleted = await deleteItemFromStorage(id);
    if (deleted) await refresh();
    return deleted;
  }

  async function toggleCleanStatus(id: string): Promise<ClothingItem | null> {
    const updated = await toggleCleanStatusInStorage(id);
    if (updated) await refresh();
    return updated;
  }

  async function markItemsWorn(ids: string[]): Promise<void> {
    await markItemsWornInStorage(ids);
    await refresh();
  }

  async function saveOutfit(outfit: Outfit): Promise<Outfit> {
    const saved = await saveOutfitToStorage({
      ...outfit,
      itemIds: outfit.itemIds.length
        ? outfit.itemIds
        : outfit.items.map((item) => item.id),
      isFavorite: true,
    });
    await refresh();
    return saved;
  }

  async function deleteOutfit(id: string): Promise<boolean> {
    const deleted = await deleteOutfitFromStorage(id);
    if (deleted) await refresh();
    return deleted;
  }

  async function toggleOutfitFavorite(id: string): Promise<Outfit | null> {
    const updated = await toggleOutfitFavoriteInStorage(id);
    if (updated) await refresh();
    return updated;
  }

  async function saveCapsule(capsule: Capsule): Promise<Capsule> {
    const saved = await saveCapsuleToStorage(capsule);
    await refresh();
    return saved;
  }

  async function deleteCapsule(id: string): Promise<boolean> {
    const deleted = await deleteCapsuleFromStorage(id);
    if (deleted) await refresh();
    return deleted;
  }

  async function saveMiscCard(card: MiscCard): Promise<MiscCard> {
    const saved = await saveMiscCardToStorage(card);
    await refresh();
    return saved;
  }

  async function deleteMiscCard(id: string): Promise<boolean> {
    const deleted = await deleteMiscCardFromStorage(id);
    if (deleted) await refresh();
    return deleted;
  }

  async function importLocalToCloud(): Promise<LocalImportResult> {
    const result = await importAllLocalToCloud();
    if (result.items > 0) clearLocalItems();
    if (result.outfits > 0) clearLocalOutfits();
    if (result.capsules > 0) clearLocalCapsules();
    if (result.miscCards > 0) clearLocalMiscCards();
    await refresh();
    return result;
  }

  function resolveOutfit(outfit: Outfit): Outfit {
    const resolved = resolveOutfitItems(outfit, items);
    return {
      ...outfit,
      items: resolved,
      itemIds: resolved.map((item) => item.id),
    };
  }

  const value: WardrobeContextValue = {
    items,
    savedOutfits,
    capsules,
    miscCards,
    filters,
    setFilters,
    loading,
    error,
    cloudEnabled,
    localItemCount,
    localOutfitCount,
    localCapsuleCount,
    localMiscCount,
    saveItem,
    saveItems,
    deleteItem,
    toggleCleanStatus,
    markItemsWorn,
    saveOutfit,
    deleteOutfit,
    toggleOutfitFavorite,
    saveCapsule,
    deleteCapsule,
    saveMiscCard,
    deleteMiscCard,
    importLocalToCloud,
    filteredItems: applyFilters(items, filters),
    resolveOutfit,
    refresh,
  };

  return (
    <WardrobeContext.Provider value={value}>
      {children}
    </WardrobeContext.Provider>
  );
}

export function useWardrobe(): WardrobeContextValue {
  const context = useContext(WardrobeContext);

  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }

  return context;
}
