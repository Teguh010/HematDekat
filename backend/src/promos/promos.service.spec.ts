import { describe, expect, it } from 'vitest';

import { PromosService } from './promos.service.js';

describe('PromosService', () => {
  it('creates a pending promo for an existing store', async () => {
    const prisma = {
      product: {
        findUnique: async () => ({
          id: 'product-1',
          slug: 'beras-premium',
          name: 'Beras premium',
          defaultUnit: 'KG',
        }),
      },
      store: {
        findUnique: async () => ({
          id: 'store-1',
          slug: 'pasar-sukajadi',
          name: 'Pasar Sukajadi',
          placeId: 'place-1',
          cityId: 'city-1',
          city: { slug: 'bandung', name: 'Bandung' },
          district: 'Sukajadi',
          lat: -6.9,
          lng: 107.6,
          type: 'MARKET',
          fetchedAt: new Date(),
        }),
      },
      promo: {
        create: async ({ data }) => ({ id: 'promo-1', ...data }),
      },
      activity: {
        create: async () => ({ id: 'activity-1' }),
      },
      $transaction: async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    } as any;

    const service = new PromosService(prisma, {
      resolveForSubmission: async () => ({
        id: 'store-1',
        slug: 'pasar-sukajadi',
        name: 'Pasar Sukajadi',
        placeId: 'place-1',
        cityId: 'city-1',
        city: { slug: 'bandung', name: 'Bandung' },
        district: 'Sukajadi',
        lat: -6.9,
        lng: 107.6,
        type: 'MARKET',
        fetchedAt: new Date(),
      }),
    } as any);

    const result = await service.create({
      userId: 'user-1',
      storeSlug: 'pasar-sukajadi',
      productSlug: 'beras-premium',
      discountPct: 10,
      conditions: 'Beli 3 gratis 1',
      validFrom: new Date('2026-01-10T00:00:00.000Z'),
      validTo: new Date('2026-01-20T00:00:00.000Z'),
    });

    expect(result).toMatchObject({ id: 'promo-1', status: 'pending' });
  });

  it('rejects promos whose period is invalid', async () => {
    const prisma = {
      product: {
        findUnique: async () => ({
          id: 'product-1',
          slug: 'beras-premium',
          name: 'Beras premium',
          defaultUnit: 'KG',
        }),
      },
      store: {
        findUnique: async () => ({
          id: 'store-1',
          slug: 'pasar-sukajadi',
          name: 'Pasar Sukajadi',
          placeId: 'place-1',
          cityId: 'city-1',
          city: { slug: 'bandung', name: 'Bandung' },
          district: 'Sukajadi',
          lat: -6.9,
          lng: 107.6,
          type: 'MARKET',
          fetchedAt: new Date(),
        }),
      },
    } as any;

    const service = new PromosService(prisma, {
      resolveForSubmission: async () => ({
        id: 'store-1',
        slug: 'pasar-sukajadi',
        name: 'Pasar Sukajadi',
        placeId: 'place-1',
        cityId: 'city-1',
        city: { slug: 'bandung', name: 'Bandung' },
        district: 'Sukajadi',
        lat: -6.9,
        lng: 107.6,
        type: 'MARKET',
        fetchedAt: new Date(),
      }),
    } as any);

    await expect(
      service.create({
        userId: 'user-1',
        storeSlug: 'pasar-sukajadi',
        productSlug: 'beras-premium',
        promoPrice: 18000,
        validFrom: new Date('2026-01-20T00:00:00.000Z'),
        validTo: new Date('2026-01-10T00:00:00.000Z'),
      }),
    ).rejects.toMatchObject({ response: { statusCode: 422, message: 'validTo must be on or after validFrom' } });
  });
});
