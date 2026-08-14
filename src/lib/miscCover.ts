const COVERS = [
  {
    keys: ['sandal', 'slipper', 'flip'],
    label: 'Sandals',
    from: '#ede6f8',
    to: '#d9c8f0',
  },
  {
    keys: ['cap', 'hat', 'beanie'],
    label: 'Caps',
    from: '#e8eef8',
    to: '#c9d6ef',
  },
  {
    keys: ['bag', 'purse', 'clutch'],
    label: 'Bags',
    from: '#f3e8ef',
    to: '#e4c9d8',
  },
  {
    keys: ['belt'],
    label: 'Belts',
    from: '#efe8dc',
    to: '#e0d0b8',
  },
  {
    keys: ['jewel', 'earring', 'necklace', 'ring'],
    label: 'Jewelry',
    from: '#f8e8ee',
    to: '#efc9d8',
  },
  {
    keys: ['scarf', 'dupatta', 'stole'],
    label: 'Scarves',
    from: '#e8f3ef',
    to: '#c5e0d4',
  },
  {
    keys: ['sunglass', 'glass', 'spec'],
    label: 'Sunglasses',
    from: '#eceaf6',
    to: '#cfc8ea',
  },
  {
    keys: ['watch'],
    label: 'Watches',
    from: '#e9eef2',
    to: '#c5d3de',
  },
] as const;

const FALLBACKS = [
  { from: '#ede6f8', to: '#d4c6ee' },
  { from: '#e8eef8', to: '#c9d6ef' },
  { from: '#f3e8ef', to: '#e4c9d8' },
  { from: '#efe8dc', to: '#e0d0b8' },
] as const;

export function miscCoverStyle(title: string, id = '') {
  const haystack = title.toLowerCase();
  const match = COVERS.find((cover) =>
    cover.keys.some((key) => haystack.includes(key)),
  );
  if (match) {
    return { from: match.from, to: match.to };
  }

  const hash = Array.from(id + title).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  return FALLBACKS[hash % FALLBACKS.length];
}
