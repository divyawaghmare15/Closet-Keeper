export type Category =
  | 'Top'
  | 'Bottom'
  | 'One-Piece'
  | 'Saree'
  | 'Kurti'
  | 'Corset'
  | 'Layer'
  | 'Footwear'
  | 'Accessory';

export type Occasion =
  | 'Casual'
  | 'Office'
  | 'Formal'
  | 'Festive'
  | 'Party'
  | 'Sports';

export type Color =
  | 'Black'
  | 'White'
  | 'Blue'
  | 'Red'
  | 'Green'
  | 'Beige'
  | 'Multicolor';

export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter' | 'All-Season';

export type Size =
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | 'XXL'
  | 'One Size'
  | '';

export interface ClothingItem {
  id: string;
  title: string;
  imageUrl: string;
  category: Category;
  occasions: Occasion[];
  color: Color;
  isClean: boolean;
  lastWornDate: string | null;
  createdAt: string;
  brand: string;
  size: Size;
  season: Season;
  price: number | null;
  notes: string;
}

export interface Outfit {
  id: string;
  title: string;
  occasion: Occasion;
  items: ClothingItem[];
  itemIds: string[];
  isFavorite: boolean;
  createdDate: string;
  matchScore?: number;
  reason?: string;
}

/** Closet snapshot sent to the outfit suggester (no photos). */
export interface OutfitCatalogItem {
  id: string;
  title: string;
  category: Category;
  color: Color;
  occasions: Occasion[];
  season: Season;
  isClean: boolean;
  daysSinceWorn: number | null;
  brand: string;
}

export interface Capsule {
  id: string;
  title: string;
  occasions: Occasion[];
  season: Season;
  itemIds: string[];
  targetCount: number;
  notes: string;
  createdDate: string;
}

export interface MiscPiece {
  id: string;
  title: string;
  imageUrl: string;
  notes: string;
  quantity: number;
}

export interface MiscCard {
  id: string;
  title: string;
  coverImageUrl: string;
  notes: string;
  pieces: MiscPiece[];
  createdDate: string;
  updatedDate: string;
}

export interface FilterState {
  category: Category | 'All';
  occasion: Occasion | 'All';
  season: Season | 'All';
  isCleanOnly: boolean;
  searchQuery: string;
}

export interface AutoTagResult {
  title?: string;
  category?: Category;
  color?: Color;
  occasions?: Occasion[];
  season?: Season;
  brand?: string;
}
