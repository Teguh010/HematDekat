import type { City, PriceReport, Prisma, Product, Promo, Store } from '@prisma/client';

import { toApiStoreType, toApiUnit } from './enums.js';

export type CityDto = {
  slug: string;
  name: string;
  province: string;
  centerLat: number;
  centerLng: number;
  storeCount: number;
};

export type PriceSummaryDto = {
  priceReportId: string;
  productSlug: string;
  productName: string;
  unit: ReturnType<typeof toApiUnit>;
  price: number;
  quantity: number;
  normalizedUnitPrice: number;
  verifiedAt: string;
  confirmationCount: number;
};

export type StoreSummaryDto = {
  slug: string;
  name: string;
  city: string;
  district: string | null;
  type: ReturnType<typeof toApiStoreType>;
  lat: number;
  lng: number;
  hasActivePromo: boolean;
  priceSummary: PriceSummaryDto | null;
};

export type StoreDetailDto = StoreSummaryDto & {
  googleMapsUrl: string;
  prices: PriceSummaryDto[];
  promos: Array<{ productSlug: string; promoPrice: number | null; discountPct: number | null; conditions: string | null; validFrom: string; validTo: string }>;
};

export function activePromoWhere(now: Date): Prisma.PromoWhereInput {
  return {
    status: 'APPROVED',
    validFrom: { lte: now },
    validTo: { gte: now },
  };
}

export function publicStoreWhere(now: Date): Prisma.StoreWhereInput {
  return {
    OR: [
      { priceReports: { some: { status: 'APPROVED' } } },
      { promos: { some: activePromoWhere(now) } },
    ],
  };
}

export const currentPriceOrderBy: Prisma.PriceReportOrderByWithRelationInput[] = [
  { verifiedAt: { sort: 'desc', nulls: 'last' } },
  { createdAt: 'desc' },
];

export function toCityDto(city: City & { _count: { stores: number } }): CityDto {
  return {
    slug: city.slug,
    name: city.name,
    province: city.province,
    centerLat: city.centerLat,
    centerLng: city.centerLng,
    storeCount: city._count.stores,
  };
}

export function toPriceSummary(report: PriceReport & { product: Product }): PriceSummaryDto {
  const verifiedAt = report.verifiedAt ?? report.createdAt;

  return {
    priceReportId: report.id,
    productSlug: report.product.slug,
    productName: report.product.name,
    unit: toApiUnit(report.unit),
    price: report.price,
    quantity: report.quantity,
    normalizedUnitPrice: report.normalizedUnitPrice,
    verifiedAt: verifiedAt.toISOString(),
    confirmationCount: report.confirmationCount,
  };
}

export function toStoreSummary(
  store: Store & {
    city: Pick<City, 'slug' | 'name' | 'province' | 'centerLat' | 'centerLng'>;
    priceReports: Array<PriceReport & { product: Product }>;
    promos: Promo[];
  },
): StoreSummaryDto {
  const current = store.priceReports[0] ?? null;

  return {
    slug: store.slug,
    name: store.name,
    city: store.city.name,
    district: store.district ?? null,
    type: toApiStoreType(store.type),
    lat: store.lat,
    lng: store.lng,
    hasActivePromo: store.promos.length > 0,
    priceSummary: current ? toPriceSummary(current) : null,
  };
}

export function toStoreDetail(
  store: Store & {
    city: Pick<City, 'slug' | 'name' | 'province' | 'centerLat' | 'centerLng'>;
    priceReports: Array<PriceReport & { product: Product }>;
    promos: Promo[];
  },
): StoreDetailDto {
  const priceSummary = store.priceReports[0] ? toPriceSummary(store.priceReports[0]) : null;

  return {
    ...toStoreSummary(store),
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.city.name}`)}`,
    prices: store.priceReports.map((report) => toPriceSummary(report)),
    promos: store.promos.map((promo) => ({
      productSlug: promo.productId,
      promoPrice: promo.promoPrice,
      discountPct: promo.discountPct,
      conditions: promo.conditions,
      validFrom: promo.validFrom.toISOString(),
      validTo: promo.validTo.toISOString(),
    })),
    priceSummary,
  };
}
