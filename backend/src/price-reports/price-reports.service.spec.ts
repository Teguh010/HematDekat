import { UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { PriceReportsService } from './price-reports.service.js';

describe('PriceReportsService', () => {
  it('uses an existing store when the report is submitted for a known place', async () => {
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
      priceReport: {
        findMany: async () => [],
        create: async ({ data }) => ({
          id: 'report-1',
          ...data,
        }),
      },
      activity: {
        create: async () => ({ id: 'activity-1' }),
      },
      $transaction: async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    } as any;

    const service = new PriceReportsService(prisma, {
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
      price: 14000,
      quantity: 1,
      unit: 'kg',
    });

    expect(result).toMatchObject({ id: 'report-1', status: 'pending' });
  });

  it('rejects a bad unit before creating a report', async () => {
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

    const service = new PriceReportsService(prisma, {
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
        price: 14000,
        quantity: 1,
        unit: 'liter',
      }),
    ).rejects.toMatchObject({ response: { statusCode: 422, message: 'Unit must be kg' } });
  });

  it('rejects a place outside supported cities', async () => {
    const prisma = {
      city: {
        findMany: async () => [
          { id: 'city-1', slug: 'bandung', centerLat: -6.9, centerLng: 107.6 },
          { id: 'city-2', slug: 'jakarta', centerLat: -6.2, centerLng: 106.8 },
        ],
      },
      product: {
        findUnique: async () => ({
          id: 'product-1',
          slug: 'beras-premium',
          name: 'Beras premium',
          defaultUnit: 'KG',
        }),
      },
      store: {
        findUnique: async () => null,
      },
    } as any;

    const service = new PriceReportsService(prisma, {
      resolveForSubmission: async () => {
        throw Object.assign(new UnprocessableEntityException('Store is outside supported cities'), {
          response: { statusCode: 422, message: 'Store is outside supported cities' },
        });
      },
    } as any);

    await expect(
      service.create({
        userId: 'user-1',
        placeId: 'new-place',
        storeType: 'market',
        productSlug: 'beras-premium',
        price: 14000,
        quantity: 1,
        unit: 'kg',
      }),
    ).rejects.toMatchObject({ response: { statusCode: 422, message: 'Store is outside supported cities' } });
  });

  function createOutlierTestService(historicalUnitPrices: number[]) {
    const prisma = {
      product: {
        findUnique: async () => ({
          id: 'product-1',
          slug: 'beras-premium',
          name: 'Beras premium',
          defaultUnit: 'KG',
        }),
      },
      priceReport: {
        findMany: async () => historicalUnitPrices.map((normalizedUnitPrice) => ({ normalizedUnitPrice })),
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: 'report-1',
          ...data,
        }),
      },
      activity: {
        create: async () => ({ id: 'activity-1' }),
      },
      $transaction: async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    } as any;

    const createdReports: Array<{ flagged: boolean; flagReason: string | null }> = [];
    const originalCreate = prisma.priceReport.create;
    prisma.priceReport.create = async ({ data }: { data: Record<string, unknown> }) => {
      createdReports.push({ flagged: data.flagged as boolean, flagReason: data.flagReason as string | null });
      return originalCreate({ data });
    };

    const service = new PriceReportsService(prisma, {
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

    return { service, createdReports };
  }

  it('never flags an outlier when fewer than 3 historical reports exist', async () => {
    const { service, createdReports } = createOutlierTestService([14000, 14500]);

    await service.create({
      userId: 'user-1',
      storeSlug: 'pasar-sukajadi',
      productSlug: 'beras-premium',
      price: 50000,
      quantity: 1,
      unit: 'kg',
    });

    expect(createdReports[0]).toMatchObject({ flagged: false, flagReason: null });
  });

  it('flags a report more than 2x the median of at least 3 recent approved reports', async () => {
    const { service, createdReports } = createOutlierTestService([14000, 14500, 15000]);

    await service.create({
      userId: 'user-1',
      storeSlug: 'pasar-sukajadi',
      productSlug: 'beras-premium',
      price: 50000,
      quantity: 1,
      unit: 'kg',
    });

    expect(createdReports[0].flagged).toBe(true);
    expect(createdReports[0].flagReason).toMatch(/vs median/);
  });

  it('flags a report less than 0.5x the median of at least 3 recent approved reports', async () => {
    const { service, createdReports } = createOutlierTestService([14000, 14500, 15000]);

    await service.create({
      userId: 'user-1',
      storeSlug: 'pasar-sukajadi',
      productSlug: 'beras-premium',
      price: 2000,
      quantity: 1,
      unit: 'kg',
    });

    expect(createdReports[0].flagged).toBe(true);
    expect(createdReports[0].flagReason).toMatch(/vs median/);
  });

  it('does not flag a report within range of the median', async () => {
    const { service, createdReports } = createOutlierTestService([14000, 14500, 15000]);

    await service.create({
      userId: 'user-1',
      storeSlug: 'pasar-sukajadi',
      productSlug: 'beras-premium',
      price: 14200,
      quantity: 1,
      unit: 'kg',
    });

    expect(createdReports[0]).toMatchObject({ flagged: false, flagReason: null });
  });
});
