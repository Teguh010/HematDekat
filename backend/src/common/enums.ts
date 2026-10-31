import type { ProductUnit, StoreType } from '@prisma/client';

export type ApiStoreType = 'supermarket' | 'minimarket' | 'market' | 'grocery-stall';
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

export function toApiUnit(value: ProductUnit): ApiProductUnit {
  return productUnitMap[value];
}

export function toDbUnit(value: ApiProductUnit): ProductUnit {
  return productUnitReverseMap[value];
}

export const toStoreType = toApiStoreType;
export const toUnit = toApiUnit;
