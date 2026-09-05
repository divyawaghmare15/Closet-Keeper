import type { Category, Color, Gender, Occasion, Season, Size } from '@/types';

export const FEMALE_CATEGORIES: Category[] = [
  'Top',
  'Bottom',
  'One-Piece',
  'Saree',
  'Kurti',
  'Corset',
  'Layer',
  'Jacket',
  'Blazer',
  'Hoodie',
  'Shorts',
  'Jeans',
  'Ethnic',
  'Innerwear',
  'Swimwear',
  'Footwear',
  'Accessory',
];

export const MALE_CATEGORIES: Category[] = [
  'Shirt',
  'T-Shirt',
  'Jeans',
  'Trousers',
  'Shorts',
  'Blazer',
  'Jacket',
  'Hoodie',
  'Suit',
  'Ethnic',
  'Innerwear',
  'Swimwear',
  'Layer',
  'Footwear',
  'Accessory',
];

export function categoriesForGender(gender: Gender | null): Category[] {
  if (gender === 'male') return MALE_CATEGORIES;
  return FEMALE_CATEGORIES;
}

/** All categories (union of both genders). */
export const CATEGORIES: Category[] = [
  ...new Set([...FEMALE_CATEGORIES, ...MALE_CATEGORIES]),
];

/** Upper-body pieces that pair with bottoms (female + male). */
export const TOP_CATEGORIES: Category[] = [
  'Top',
  'Kurti',
  'Corset',
  'Shirt',
  'T-Shirt',
  'Ethnic',
];

/** Lower-body pieces that pair with tops. */
export const BOTTOM_CATEGORIES: Category[] = [
  'Bottom',
  'Jeans',
  'Trousers',
  'Shorts',
];

/** Standalone looks that do not need a separate bottom. */
export const ONE_PIECE_CATEGORIES: Category[] = [
  'One-Piece',
  'Saree',
  'Suit',
  'Swimwear',
];

/** Optional outer layers over a core look. */
export const LAYER_CATEGORIES: Category[] = [
  'Layer',
  'Jacket',
  'Blazer',
  'Hoodie',
];

export function isTopCategory(category: Category): boolean {
  return TOP_CATEGORIES.includes(category);
}

export function isBottomCategory(category: Category): boolean {
  return BOTTOM_CATEGORIES.includes(category);
}

export function isOnePieceCategory(category: Category): boolean {
  return ONE_PIECE_CATEGORIES.includes(category);
}

export function isLayerCategory(category: Category): boolean {
  return LAYER_CATEGORIES.includes(category);
}

export const OCCASIONS: Occasion[] = [
  'Casual',
  'Office',
  'Formal',
  'Festive',
  'Party',
  'Sports',
  'Date Night',
  'Travel',
  'Lounge',
  'Wedding',
  'Interview',
];

export const COLORS: Color[] = [
  'Black',
  'White',
  'Grey',
  'Navy',
  'Blue',
  'Red',
  'Green',
  'Beige',
  'Brown',
  'Pink',
  'Purple',
  'Yellow',
  'Orange',
  'Maroon',
  'Cream',
  'Olive',
  'Teal',
  'Gold',
  'Silver',
  'Multicolor',
];

export const SEASONS: Season[] = [
  'All-Season',
  'Spring',
  'Summer',
  'Monsoon',
  'Fall',
  'Winter',
];

export const SIZES: Size[] = [
  '',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '44',
  'Free Size',
  'One Size',
];

/** Neutral colors pair with everything. */
export const NEUTRAL_COLORS: Color[] = ['Black', 'White', 'Beige', 'Grey', 'Cream'];

/** Colors that generally clash when both are strong. */
export const COLOR_CLASHES: Array<[Color, Color]> = [
  ['Red', 'Green'],
  ['Red', 'Blue'],
  ['Green', 'Blue'],
];

export const MISC_SUGGESTIONS = [
  'Sandals I have',
  'Caps I have',
  'Bags I have',
  'Belts I have',
  'Jewelry I have',
  'Scarves I have',
  'Sunglasses I have',
  'Watches I have',
] as const;
