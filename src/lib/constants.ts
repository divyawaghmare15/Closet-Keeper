import type { Category, Color, Occasion, Season, Size } from '@/types';

export const CATEGORIES: Category[] = [
  'Top',
  'Bottom',
  'One-Piece',
  'Saree',
  'Kurti',
  'Corset',
  'Layer',
  'Footwear',
  'Accessory',
];

export const OCCASIONS: Occasion[] = [
  'Casual',
  'Office',
  'Formal',
  'Festive',
  'Party',
  'Sports',
];

export const COLORS: Color[] = [
  'Black',
  'White',
  'Blue',
  'Red',
  'Green',
  'Beige',
  'Multicolor',
];

export const SEASONS: Season[] = [
  'All-Season',
  'Spring',
  'Summer',
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
  'One Size',
];

/** Neutral colors pair with everything. */
export const NEUTRAL_COLORS: Color[] = ['Black', 'White', 'Beige'];

/** Colors that generally clash when both are strong. */
export const COLOR_CLASHES: Array<[Color, Color]> = [
  ['Red', 'Green'],
  ['Red', 'Blue'],
  ['Green', 'Blue'],
];
