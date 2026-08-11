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
