import type { ProductCategory, ProductUnit, StoreType } from '@prisma/client';

export type ApiStoreType = 'supermarket' | 'minimarket' | 'market' | 'grocery-stall';
export type ApiProductCategory =
  | 'rice'
  | 'cooking-oil'
  | 'sugar'
  | 'eggs'
  | 'flour'
  | 'salt'
  | 'instant-noodles'
  | 'chili'
  | 'shallots'
  | 'garlic'
  | 'chicken'
  | 'beef'
  | 'fish';
export type ApiProductUnit = 'kg' | 'liter' | 'pcs' | 'pack' | 'tray';

const storeTypeMap: Record<StoreType, ApiStoreType> = {
  SUPERMARKET: 'supermarket',
  MINIMARKET: 'minimarket',
  MARKET: 'market',
  GROCERY_STALL: 'grocery-stall',
};

const storeTypeReverseMap: Record<ApiStoreType, StoreType> = {
  supermarket: 'SUPERMARKET',
  minimarket: 'MINIMARKET',
  market: 'MARKET',
  'grocery-stall': 'GROCERY_STALL',
};

const productCategoryMap: Record<ProductCategory, ApiProductCategory> = {
  RICE: 'rice',
  COOKING_OIL: 'cooking-oil',
  SUGAR: 'sugar',
  EGGS: 'eggs',
  FLOUR: 'flour',
  SALT: 'salt',
  INSTANT_NOODLES: 'instant-noodles',
  CHILI: 'chili',
  SHALLOTS: 'shallots',
  GARLIC: 'garlic',
  CHICKEN: 'chicken',
  BEEF: 'beef',
  FISH: 'fish',
};

const productCategoryReverseMap: Record<ApiProductCategory, ProductCategory> = {
  rice: 'RICE',
  'cooking-oil': 'COOKING_OIL',
  sugar: 'SUGAR',
  eggs: 'EGGS',
  flour: 'FLOUR',
  salt: 'SALT',
  'instant-noodles': 'INSTANT_NOODLES',
  chili: 'CHILI',
  shallots: 'SHALLOTS',
  garlic: 'GARLIC',
  chicken: 'CHICKEN',
  beef: 'BEEF',
  fish: 'FISH',
};

const productUnitMap: Record<ProductUnit, ApiProductUnit> = {
  KG: 'kg',
  LITER: 'liter',
  PCS: 'pcs',
  PACK: 'pack',
  TRAY: 'tray',
};

const productUnitReverseMap: Record<ApiProductUnit, ProductUnit> = {
  kg: 'KG',
  liter: 'LITER',
  pcs: 'PCS',
  pack: 'PACK',
  tray: 'TRAY',
};

export function toApiStoreType(value: StoreType): ApiStoreType {
  return storeTypeMap[value];
}

export function toDbStoreType(value: ApiStoreType): StoreType {
  return storeTypeReverseMap[value];
}

export function toApiCategory(value: ProductCategory): ApiProductCategory {
  return productCategoryMap[value];
}

export function toDbCategory(value: ApiProductCategory): ProductCategory {
  return productCategoryReverseMap[value];
}

export function toApiUnit(value: ProductUnit): ApiProductUnit {
  return productUnitMap[value];
}

export function toDbUnit(value: ApiProductUnit): ProductUnit {
  return productUnitReverseMap[value];
}

export const toStoreType = toApiStoreType;
export const toCategory = toApiCategory;
export const toUnit = toApiUnit;
