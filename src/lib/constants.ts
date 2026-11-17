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
  'Olive',
  'Beige',
  'Brown',
  'Pink',
  'Purple',
  'Yellow',
  'Orange',
  'Maroon',
  'Cream',
  'Teal',
  'Gold',
  'Silver',
  'Multicolor',
];

/**
 * Synonyms the vision model often returns instead of our palette names.
 * Longer / more specific phrases should be checked first by the matcher.
 */
export const COLOR_ALIASES: Array<[string, Color]> = [
  ['navy blue', 'Navy'],
  ['midnight blue', 'Navy'],
  ['dark navy', 'Navy'],
  ['olive green', 'Olive'],
  ['army green', 'Olive'],
  ['forest green', 'Green'],
  ['emerald', 'Green'],
  ['mint', 'Green'],
  ['sky blue', 'Blue'],
  ['light blue', 'Blue'],
  ['royal blue', 'Blue'],
  ['dark blue', 'Navy'],
  ['burgundy', 'Maroon'],
  ['oxblood', 'Maroon'],
  ['wine red', 'Maroon'],
  ['wine', 'Maroon'],
  ['maroon', 'Maroon'],
  ['dark red', 'Maroon'],
  ['deep red', 'Maroon'],
  ['crimson', 'Red'],
  ['scarlet', 'Red'],
  ['charcoal', 'Grey'],
  ['graphite', 'Grey'],
  ['gray', 'Grey'],
  ['grey', 'Grey'],
  ['off white', 'Cream'],
  ['off-white', 'Cream'],
  ['ivory', 'Cream'],
  ['cream', 'Cream'],
  ['beige', 'Beige'],
  ['khaki', 'Beige'],
  ['tan', 'Beige'],
  ['camel', 'Beige'],
  ['mustard', 'Yellow'],
  ['gold', 'Gold'],
  ['silver', 'Silver'],
  ['teal', 'Teal'],
  ['turquoise', 'Teal'],
  ['aqua', 'Teal'],
  ['cyan', 'Teal'],
  ['magenta', 'Pink'],
  ['fuchsia', 'Pink'],
  ['hot pink', 'Pink'],
  ['lavender', 'Purple'],
  ['violet', 'Purple'],
  ['lilac', 'Purple'],
  ['coral', 'Orange'],
  ['peach', 'Orange'],
  ['rust', 'Orange'],
  ['brown', 'Brown'],
  ['chocolate', 'Brown'],
  ['coffee', 'Brown'],
  ['multicolor', 'Multicolor'],
  ['multi color', 'Multicolor'],
  ['multi-color', 'Multicolor'],
  ['printed', 'Multicolor'],
  ['floral', 'Multicolor'],
];

/** Friendlier labels for preset swatches / selects. */
export const COLOR_LABELS: Partial<Record<string, string>> = {
  Olive: 'Olive Green',
};

export function colorLabel(color: string): string {
  return COLOR_LABELS[color] ?? color;
}

/** Map free-text color names (incl. aliases) onto our palette. */
export function resolveColorName(value: unknown): Color | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const lower = value.trim().toLowerCase().replace(/[_/]+/g, ' ');

  const exact = (COLORS as readonly string[]).find((c) => c.toLowerCase() === lower);
  if (exact) return exact as Color;

  // Prefer longer aliases first (e.g. "navy blue" before "blue").
  const aliases = [...COLOR_ALIASES].sort((a, b) => b[0].length - a[0].length);
  for (const [alias, color] of aliases) {
    if (lower === alias || lower.includes(alias)) return color;
  }

  // Prefer longer palette names (Navy before Blue, Maroon before Red).
  const byLength = [...COLORS].sort((a, b) => b.length - a.length);
  for (const color of byLength) {
    const c = color.toLowerCase();
    if (lower.includes(c) || c.includes(lower)) return color;
  }

  return undefined;
}

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
