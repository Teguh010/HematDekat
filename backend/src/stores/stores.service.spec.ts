import { describe, expect, it } from 'vitest';

import { filterAndSortStores } from './stores.service.js';

const now = new Date('2026-01-15T00:00:00.000Z');

function makeStore(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'store-1',
    slug: 'store-1',
    name: 'Pasar Sukajadi',
    type: 'MARKET',
    city: { slug: 'bandung', name: 'Bandung' },
    district: 'Sukajadi',
    lat: -6.9,
    lng: 107.6,
    priceReports: [],
    promos: [],
    ...overrides,
  };
}

describe('StoresService filtering and sorting', () => {
  it('filters by type, max price, promo and freshness', () => {
    const stores = [
      makeStore({
        id: 'a',
        name: 'Toko A',
        type: 'SUPERMARKET',
        priceReports: [{
          id: 'r1',
          normalizedUnitPrice: 12000,
          verifiedAt: new Date('2026-01-10T00:00:00.000Z'),
          status: 'APPROVED',
          product: { slug: 'beras-premium' },
        }],
        promos: [{ validFrom: new Date('2026-01-01'), validTo: new Date('2026-01-30'), status: 'APPROVED' }],
      }),
      makeStore({
        id: 'b',
        name: 'Toko B',
        type: 'MINIMARKET',
        priceReports: [{
          id: 'r2',
          normalizedUnitPrice: 25000,
          verifiedAt: new Date('2026-01-04T00:00:00.000Z'),
          status: 'APPROVED',
          product: { slug: 'beras-premium' },
        }],
        promos: [],
      }),
      makeStore({
        id: 'c',
        name: 'Toko C',
        type: 'SUPERMARKET',
        priceReports: [],
        promos: [],
      }),
    ];

    const result = filterAndSortStores(stores as never[], {
      type: ['supermarket'],
      maxPrice: 15000,
      promo: true,
      fresh: 14,
      sort: 'cheapest',
      offset: 0,
      limit: 20,
    }, now);

    expect(result.map((store) => store.id)).toEqual(['a']);
  });

  it('sorts by cheapest, recent and nearest while keeping no-price stores last', () => {
    const stores = [
      makeStore({
        id: 'cheap',
        name: 'Cheap',
        lat: -6.0,
        lng: 106.0,
        priceReports: [{ id: 'r1', normalizedUnitPrice: 10000, verifiedAt: new Date('2026-01-03T00:00:00.000Z'), status: 'APPROVED', product: { slug: 'beras-premium' } }],
      }),
      makeStore({
        id: 'recent',
        name: 'Recent',
        lat: -6.2,
        lng: 106.9,
        priceReports: [{ id: 'r2', normalizedUnitPrice: 15000, verifiedAt: new Date('2026-01-14T00:00:00.000Z'), status: 'APPROVED', product: { slug: 'beras-premium' } }],
      }),
      makeStore({
        id: 'nearest',
        name: 'Nearest',
        lat: -6.1,
        lng: 106.8,
        priceReports: [{ id: 'r3', normalizedUnitPrice: 14000, verifiedAt: new Date('2026-01-07T00:00:00.000Z'), status: 'APPROVED', product: { slug: 'beras-premium' } }],
      }),
      makeStore({
        id: 'no-price',
        name: 'No Price',
        lat: -6.1,
        lng: 106.7,
        priceReports: [],
      }),
    ];

    expect(filterAndSortStores(stores as never[], { sort: 'cheapest', offset: 0, limit: 20 }, now).map((store) => store.id)).toEqual(['cheap', 'nearest', 'recent', 'no-price']);
    expect(filterAndSortStores(stores as never[], { sort: 'recent', offset: 0, limit: 20 }, now).map((store) => store.id)).toEqual(['recent', 'nearest', 'cheap', 'no-price']);
    expect(filterAndSortStores(stores as never[], { sort: 'nearest', lat: -6.15, lng: 106.8, offset: 0, limit: 20 }, now).map((store) => store.id)).toEqual(['nearest', 'recent', 'cheap', 'no-price']);
  });
});
