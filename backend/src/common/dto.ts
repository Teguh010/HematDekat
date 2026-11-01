import type { City, PriceReport, Prisma, Product, Promo, Store } from '@prisma/client';

import { toApiCategory, toApiStoreType, toApiUnit } from './enums.js';

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

export type ProductDto = {
  slug: string;
  name: string;
  category: ReturnType<typeof toApiCategory>;
  defaultUnit: ReturnType<typeof toApiUnit>;
};

export type PromoSummaryDto = {
  id: string;
  productSlug: string;
  productName: string;
  promoPrice: number | null;
  discountPct: number | null;
  conditions: string | null;
  validFrom: string;
  validTo: string;
  confirmationCount: number;
};

export type StoreSummaryDto = {
  id: string;
  slug: string;
  name: string;
  type: ReturnType<typeof toApiStoreType>;
  city: { slug: string; name: string };
  district: string | null;
  lat: number;
  lng: number;
  distanceKm: number | null;
  price: PriceSummaryDto | null;
  hasActivePromo: boolean;
};

export type StoreDetailDto = Omit<StoreSummaryDto, 'price' | 'distanceKm'> & {
  placeId: string;
  prices: PriceSummaryDto[];
  promos: PromoSummaryDto[];
  googleMapsUrl: string;
};

export type PageDto<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};

type StoreWithRelations = Store & {
  city: Pick<City, 'slug' | 'name'>;
  priceReports: Array<PriceReport & { product: Product }>;
  promos: Array<
    Promo & {
      product?: Product;
      _count?: { votes: number };
    }
  >;
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

export function toProductDto(product: Product): ProductDto {
  return {
    slug: product.slug,
    name: product.name,
    category: toApiCategory(product.category),
    defaultUnit: toApiUnit(product.defaultUnit),
  };
}

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

export function toPromoSummary(
  promo: Promo & { product: Product; _count?: { votes: number } },
): PromoSummaryDto {
  return {
    id: promo.id,
    productSlug: promo.product.slug,
    productName: promo.product.name,
    promoPrice: promo.promoPrice,
    discountPct: promo.discountPct,
    conditions: promo.conditions,
    validFrom: promo.validFrom.toISOString(),
    validTo: promo.validTo.toISOString(),
    confirmationCount: promo._count?.votes ?? 0,
  };
}

/** Keep the newest approved report per product (reports must already be ordered). */
export function currentPricesByProduct(
  reports: Array<PriceReport & { product: Product }>,
): PriceSummaryDto[] {
  const seen = new Set<string>();
  const prices: PriceSummaryDto[] = [];

  for (const report of reports) {
    if (seen.has(report.productId)) {
      continue;
    }

    seen.add(report.productId);
    prices.push(toPriceSummary(report));
  }

  return prices.sort((a, b) => a.productName.localeCompare(b.productName));
}

export function toStoreSummary(store: StoreWithRelations): StoreSummaryDto {
  const current = store.priceReports[0] ?? null;

  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    type: toApiStoreType(store.type),
    city: { slug: store.city.slug, name: store.city.name },
    district: store.district ?? null,
    lat: store.lat,
    lng: store.lng,
    distanceKm: null,
    price: current ? toPriceSummary(current) : null,
    hasActivePromo: store.promos.length > 0,
  };
}

export function toStoreDetail(store: StoreWithRelations): StoreDetailDto {
  const { price: _price, distanceKm: _distanceKm, ...summary } = toStoreSummary(store);

  return {
    ...summary,
    placeId: store.placeId,
    prices: currentPricesByProduct(store.priceReports),
    promos: store.promos
      .filter((promo): promo is Promo & { product: Product; _count?: { votes: number } } => Boolean(promo.product))
      .map(toPromoSummary)
      .sort((a, b) => a.validTo.localeCompare(b.validTo)),
    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}&query_place_id=${encodeURIComponent(store.placeId)}`,
  };
}
