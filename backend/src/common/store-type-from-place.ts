import type { StoreType } from '@prisma/client';

export type PlacesAddressComponent = {
  longText?: string | null;
  shortText?: string | null;
  types?: string[];
};

export type PlacesPlace = {
  types?: string[];
  primaryType?: string | null;
  displayName?: { text?: string } | null;
};

export type ApiStoreType = 'supermarket' | 'minimarket' | 'market' | 'grocery-stall';

const typePriority: Array<[string[], ApiStoreType]> = [
  [['supermarket', 'hypermarket'], 'supermarket'],
  [['convenience_store'], 'minimarket'],
  [['market', 'farmers_market'], 'market'],
];

const marketKeywords = /pasar/i;
const minimarketKeywords = /alfamart|indomaret|alfamidi|circle k|lawson/i;
const supermarketKeywords = /superindo|super indo|hypermart|transmart|lotte|giant|hero|foodmart|farmers market/i;

function normalizeType(value: string): string {
  return value.toLowerCase().replace(/[_\s-]+/g, '');
}

export function storeTypeFromPlace(place: PlacesPlace): ApiStoreType {
  const allTypes = [...(place.types ?? []), ...(place.primaryType ? [place.primaryType] : [])].map((entry) => normalizeType(entry));

  for (const [candidates, result] of typePriority) {
    if (allTypes.some((type) => candidates.some((candidate) => normalizeType(candidate) === type))) {
      return result;
    }
  }

  const name = place.displayName?.text ?? '';
  const normalizedName = name.toLowerCase();

  if (marketKeywords.test(normalizedName)) {
    return 'market';
  }

  if (minimarketKeywords.test(normalizedName)) {
    return 'minimarket';
  }

  if (supermarketKeywords.test(normalizedName)) {
    return 'supermarket';
  }

  return 'grocery-stall';
}

export function districtFromAddressComponents(components: PlacesAddressComponent[] | null | undefined): string | null {
  const districtPriorities = ['administrative_area_level_3', 'administrative_area_level_4'];

  for (const type of districtPriorities) {
    const component = components?.find((entry) => entry.types?.includes(type));
    if (!component) {
      continue;
    }

    return component.longText ?? component.shortText ?? null;
  }

  return null;
}

export function toDbStoreType(value: ApiStoreType): StoreType {
  switch (value) {
    case 'supermarket':
      return 'SUPERMARKET';
    case 'minimarket':
      return 'MINIMARKET';
    case 'market':
      return 'MARKET';
    case 'grocery-stall':
      return 'GROCERY_STALL';
    default:
      return 'GROCERY_STALL';
  }
}
