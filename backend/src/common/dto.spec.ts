import { describe, expect, it } from 'vitest';

import {
  currentPricesByProduct,
  publicStoreWhere,
  toCityDto,
  toPriceSummary,
  toProductDto,
  toStoreDetail,
  toStoreSummary,
} from './dto.js';
import { toApiCategory, toApiUnit, toDbCategory, toDbUnit, toStoreType } from './enums.js';

describe('public DTO helpers', () => {
  it('maps city counts and public-store visibility without exposing pending reports', () => {
    const city = {
      slug: 'jakarta',
      name: 'Jakarta',
      province: 'DKI Jakarta',
      centerLat: -6.2,
      centerLng: 106.8,
      _count: { stores: 12 },
    };

    expect(toCityDto(city as never)).toEqual({
      slug: 'jakarta',
      name: 'Jakarta',
      province: 'DKI Jakarta',
      centerLat: -6.2,
      centerLng: 106.8,
      storeCount: 12,
    });

    const now = new Date('2026-01-15T00:00:00.000Z');
    const where = publicStoreWhere(now);

    expect(where).toEqual({
      OR: [
        { priceReports: { some: { status: 'APPROVED' } } },
        { promos: { some: { status: 'APPROVED', validFrom: { lte: now }, validTo: { gte: now } } } },
      ],
    });
  });

  it('maps DB enums to API enums and price summaries', () => {
    expect(toApiCategory('RICE')).toBe('rice');
    expect(toDbCategory('rice')).toBe('RICE');
    expect(toApiUnit('KG')).toBe('kg');
    expect(toDbUnit('kg')).toBe('KG');
    expect(toStoreType('SUPERMARKET')).toBe('supermarket');

    const report = {
      id: 'report-1',
      price: 14000,
      quantity: 5,
      unit: 'KG',
      normalizedUnitPrice: 2800,
      confirmationCount: 3,
      verifiedAt: new Date('2026-01-14T00:00:00.000Z'),
      createdAt: new Date('2026-01-10T00:00:00.000Z'),
      product: { slug: 'beras-premium', name: 'Beras Premium' },
    };

    expect(toPriceSummary(report as never)).toEqual({
      priceReportId: 'report-1',
      productSlug: 'beras-premium',
      productName: 'Beras Premium',
      unit: 'kg',
      price: 14000,
      quantity: 5,
      normalizedUnitPrice: 2800,
      verifiedAt: '2026-01-14T00:00:00.000Z',
      confirmationCount: 3,
    });

    const product = {
      slug: 'beras-premium',
      name: 'Beras premium',
      category: 'RICE',
      defaultUnit: 'KG',
    };

    expect(toProductDto(product as never)).toEqual({
      slug: 'beras-premium',
      name: 'Beras premium',
      category: 'rice',
      defaultUnit: 'kg',
    });
  });

  it('maps store summaries and details to the API contract shape', () => {
    const product = {
      id: 'product-1',
      slug: 'beras-premium',
      name: 'Beras premium',
      category: 'RICE',
      defaultUnit: 'KG',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const report = {
      id: 'report-1',
      storeId: 'store-1',
      productId: 'product-1',
      reporterId: null,
      price: 14700,
      quantity: 1,
      unit: 'KG',
      normalizedUnitPrice: 14700,
      status: 'APPROVED',
      verifiedAt: new Date('2026-01-14T00:00:00.000Z'),
      confirmationCount: 2,
      flagged: false,
      flagReason: null,
      createdAt: new Date('2026-01-10T00:00:00.000Z'),
      updatedAt: new Date('2026-01-14T00:00:00.000Z'),
      product,
    };

    const store = {
      id: 'store-1',
      slug: 'pasar-sukajadi',
      name: 'Pasar Sukajadi',
      placeId: 'bandung-pasar-sukajadi',
      type: 'MARKET',
      cityId: 'city-1',
      district: 'Sukajadi',
      lat: -6.885,
      lng: 107.6,
      fetchedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      city: { slug: 'bandung', name: 'Bandung' },
      priceReports: [report],
      promos: [
        {
          id: 'promo-1',
          storeId: 'store-1',
          productId: 'product-1',
          submitterId: null,
          promoPrice: 14000,
          discountPct: null,
          conditions: null,
          validFrom: new Date('2026-01-01T00:00:00.000Z'),
          validTo: new Date('2026-01-31T00:00:00.000Z'),
          status: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
          product,
          _count: { votes: 4 },
        },
      ],
    };

    expect(toStoreSummary(store as never)).toEqual({
      id: 'store-1',
      slug: 'pasar-sukajadi',
      name: 'Pasar Sukajadi',
      type: 'market',
      city: { slug: 'bandung', name: 'Bandung' },
      district: 'Sukajadi',
      lat: -6.885,
      lng: 107.6,
      distanceKm: null,
      price: {
        priceReportId: 'report-1',
        productSlug: 'beras-premium',
        productName: 'Beras premium',
        unit: 'kg',
        price: 14700,
        quantity: 1,
        normalizedUnitPrice: 14700,
        verifiedAt: '2026-01-14T00:00:00.000Z',
        confirmationCount: 2,
      },
      hasActivePromo: true,
    });

    const detail = toStoreDetail(store as never);
    expect(detail.placeId).toBe('bandung-pasar-sukajadi');
    expect(detail.googleMapsUrl).toContain('query_place_id=bandung-pasar-sukajadi');
    expect(detail.prices).toHaveLength(1);
    expect(detail.promos[0]).toMatchObject({
      id: 'promo-1',
      productSlug: 'beras-premium',
      productName: 'Beras premium',
      confirmationCount: 4,
    });
    expect(detail).not.toHaveProperty('price');
    expect(detail).not.toHaveProperty('distanceKm');
  });

  it('keeps only the newest report per product when building the price list', () => {
    const older = {
      id: 'old',
      productId: 'p1',
      verifiedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      price: 15000,
      quantity: 1,
      unit: 'KG',
      normalizedUnitPrice: 15000,
      confirmationCount: 0,
      product: { slug: 'beras-premium', name: 'Beras premium' },
    };
    const newer = {
      ...older,
      id: 'new',
      verifiedAt: new Date('2026-01-10T00:00:00.000Z'),
      createdAt: new Date('2026-01-10T00:00:00.000Z'),
      price: 14000,
      normalizedUnitPrice: 14000,
    };

    expect(currentPricesByProduct([newer, older] as never)).toEqual([
      expect.objectContaining({ priceReportId: 'new', normalizedUnitPrice: 14000 }),
    ]);
  });
});
