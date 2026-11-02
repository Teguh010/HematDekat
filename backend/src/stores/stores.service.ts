import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import {
  activePromoWhere,
  currentPriceOrderBy,
  type PageDto,
  publicStoreWhere,
  type StoreSummaryDto,
  toStoreDetail,
  toStoreSummary,
} from '../common/dto.js';
import { toApiStoreType, toDbStoreType } from '../common/enums.js';
import { haversineKm } from '../common/geo.js';
import { PlacesService } from '../places/places.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { slugify } from '../common/slugify.js';

export type StoreListQuery = {
  city?: string;
  q?: string;
  product?: string;
  type?: string[];
  maxPrice?: number;
  promo?: boolean;
  fresh?: 3 | 14 | 30;
  sort?: 'cheapest' | 'nearest' | 'recent';
  lat?: number;
  lng?: number;
  bbox?: [number, number, number, number];
  offset: number;
  limit: number;
};

type StoreWithRelations = Parameters<typeof toStoreSummary>[0];

export function filterAndSortStores(
  stores: StoreWithRelations[],
  query: Pick<StoreListQuery, 'type' | 'maxPrice' | 'promo' | 'fresh' | 'sort' | 'lat' | 'lng' | 'bbox'>,
  now = new Date(),
): StoreWithRelations[] {
  const hasLocation = query.lat != null && query.lng != null;

  const filtered = stores.filter((store) => {
    if (query.type && query.type.length > 0 && !query.type.includes(toApiStoreType(store.type))) {
      return false;
    }

    if (query.bbox) {
      const [south, west, north, east] = query.bbox;
      if (!(store.lat >= south && store.lat <= north && store.lng >= west && store.lng <= east)) {
        return false;
      }
    }

    const price = store.priceReports[0] ?? null;

    if (query.maxPrice != null) {
      if (!price || price.normalizedUnitPrice > query.maxPrice) {
        return false;
      }
    }

    if (query.fresh != null) {
      if (!price) {
        return false;
      }

      const ageDays = (now.getTime() - (price.verifiedAt ?? price.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > query.fresh) {
        return false;
      }
    }

    if (query.promo === true && store.promos.length === 0) {
      return false;
    }

    return true;
  });

  const sortKey = query.sort ?? 'cheapest';

  filtered.sort((a, b) => {
    const aPrice = a.priceReports[0] ?? null;
    const bPrice = b.priceReports[0] ?? null;
    const aHasPrice = aPrice !== null;
    const bHasPrice = bPrice !== null;

    if (aHasPrice !== bHasPrice) {
      return aHasPrice ? -1 : 1;
    }

    if (!aHasPrice && !bHasPrice) {
      return a.name.localeCompare(b.name);
    }

    const aTime = aPrice ? (aPrice.verifiedAt ?? aPrice.createdAt).getTime() : 0;
    const bTime = bPrice ? (bPrice.verifiedAt ?? bPrice.createdAt).getTime() : 0;
    const aDistance = hasLocation ? haversineKm(query.lat!, query.lng!, a.lat, a.lng) : Number.POSITIVE_INFINITY;
    const bDistance = hasLocation ? haversineKm(query.lat!, query.lng!, b.lat, b.lng) : Number.POSITIVE_INFINITY;

    switch (sortKey) {
      case 'recent': {
        const timeDelta = bTime - aTime;
        return timeDelta !== 0 ? timeDelta : a.name.localeCompare(b.name);
      }
      case 'nearest': {
        const distanceDelta = aDistance - bDistance;
        return distanceDelta !== 0 ? distanceDelta : a.name.localeCompare(b.name);
      }
      case 'cheapest':
      default: {
        const priceDelta = (aPrice?.normalizedUnitPrice ?? Number.POSITIVE_INFINITY) - (bPrice?.normalizedUnitPrice ?? Number.POSITIVE_INFINITY);
        return priceDelta !== 0 ? priceDelta : a.name.localeCompare(b.name);
      }
    }
  });

  return filtered;
}


@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly places: PlacesService,
  ) {}

  async list(query: StoreListQuery): Promise<PageDto<StoreSummaryDto>> {
    const now = new Date();
    const where: Prisma.StoreWhereInput = {
      AND: [
        publicStoreWhere(now),
        query.city ? { city: { slug: query.city } } : {},
        query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { district: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {},
        query.type && query.type.length > 0
          ? {
              type: { in: query.type.map((value) => toDbStoreType(value as Parameters<typeof toDbStoreType>[0])) },
            }
          : {},
        query.bbox
          ? {
              AND: [
                { lat: { gte: Math.min(query.bbox[0], query.bbox[2]) } },
                { lat: { lte: Math.max(query.bbox[0], query.bbox[2]) } },
                { lng: { gte: Math.min(query.bbox[1], query.bbox[3]) } },
                { lng: { lte: Math.max(query.bbox[1], query.bbox[3]) } },
              ],
            }
          : {},
        query.product
          ? {
              priceReports: {
                some: {
                  status: 'APPROVED',
                  product: { slug: query.product },
                },
              },
            }
          : {},
      ],
    };

    const stores = await this.prisma.store.findMany({
      where,
      include: {
        city: true,
        priceReports: {
          where: {
            status: 'APPROVED',
            ...(query.product ? { product: { slug: query.product } } : {}),
          },
          orderBy: currentPriceOrderBy,
          take: 1,
          include: { product: true },
        },
        promos: {
          where: activePromoWhere(now),
          orderBy: { validTo: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
      take: 1000,
    });

    const filtered = filterAndSortStores(stores, query, now);
    const page = filtered.slice(query.offset, query.offset + query.limit);

    return {
      items: page.map(toStoreSummary),
      total: filtered.length,
      offset: query.offset,
      limit: query.limit,
    };
  }

  async findBySlug(slug: string) {
    const now = new Date();
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        city: true,
        priceReports: {
          where: { status: 'APPROVED' },
          orderBy: currentPriceOrderBy,
          include: { product: true },
        },
        promos: {
          where: activePromoWhere(now),
          orderBy: { validTo: 'asc' },
          include: {
            product: true,
            _count: { select: { votes: true } },
          },
        },
      },
    });

    if (!store) {
      return null;
    }

    // A store is public only when it has at least one approved report or active promo.
    if (store.priceReports.length === 0 && store.promos.length === 0) {
      return null;
    }

    return toStoreDetail(store);
  }

  async resolveForSubmission(input: {
    storeSlug?: string;
    placeId?: string;
    storeType?: 'supermarket' | 'minimarket' | 'market' | 'grocery-stall';
  }) {
    if (input.storeSlug) {
      const store = await this.prisma.store.findUnique({
        where: { slug: input.storeSlug },
        include: { city: true },
      });

      if (!store) {
        throw new NotFoundException(`Store with slug "${input.storeSlug}" not found`);
      }

      return store;
    }

    if (!input.placeId) {
      throw new NotFoundException('Either storeSlug or placeId is required');
    }

    const existingStore = await this.prisma.store.findUnique({
      where: { placeId: input.placeId },
      include: { city: true },
    });

    if (existingStore) {
      return existingStore;
    }

    const place = await this.places.lookup({
      placeId: input.placeId,
      sessionToken: crypto.randomUUID(),
    });

    if (!place) {
      throw new NotFoundException(`Place with id "${input.placeId}" not found`);
    }

    const cities = await this.prisma.city.findMany({
      select: { id: true, slug: true, name: true, centerLat: true, centerLng: true },
    });

    let nearestCity: (typeof cities)[number] | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const city of cities) {
      const distance = haversineKm(place.lat, place.lng, city.centerLat, city.centerLng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCity = city;
      }
    }

    if (!nearestCity || nearestDistance > 50) {
      throw new UnprocessableEntityException('Store is outside supported cities');
    }

    const baseSlug = slugify(`${place.name} ${place.district ?? nearestCity.name}`) || 'new-store';
    let slug = baseSlug;
    let index = 2;

    while (await this.prisma.store.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }

    return this.prisma.store.create({
      data: {
        slug,
        name: place.name,
        placeId: place.placeId,
        type: toDbStoreType(input.storeType ?? 'grocery-stall'),
        cityId: nearestCity.id,
        district: place.district ?? null,
        lat: place.lat,
        lng: place.lng,
        fetchedAt: new Date(),
      },
      include: { city: true },
    });
  }
}
