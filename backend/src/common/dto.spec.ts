import { describe, expect, it } from 'vitest';

import { publicStoreWhere, toCityDto, toPriceSummary } from './dto.js';
import { toApiUnit, toDbUnit, toStoreType } from './enums.js';

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
  });
});
