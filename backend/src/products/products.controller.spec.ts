import { describe, expect, it } from 'vitest';

import { ProductsController } from './products.controller.js';

describe('ProductsController', () => {
  it('returns the product detail payload with city averages', async () => {
    const controller = new ProductsController({
      detail: async () => ({
        product: {
          slug: 'beras-premium',
          name: 'Beras premium',
          category: 'rice',
          defaultUnit: 'kg',
        },
        cheapest: [
          {
            id: 's1',
            slug: 'pasar-sukajadi',
            name: 'Pasar Sukajadi',
            type: 'market',
            city: { slug: 'bandung', name: 'Bandung' },
            district: 'Sukajadi',
            lat: -6.9,
            lng: 107.6,
            distanceKm: null,
            price: {
              priceReportId: 'p1',
              productSlug: 'beras-premium',
              productName: 'Beras premium',
              unit: 'kg',
              price: 14000,
              quantity: 1,
              normalizedUnitPrice: 14000,
              verifiedAt: '2026-01-01T00:00:00.000Z',
              confirmationCount: 2,
            },
            hasActivePromo: false,
          },
        ],
        cityAverages: [
          { citySlug: 'bandung', cityName: 'Bandung', averageUnitPrice: 14000, reportCount: 1 },
        ],
      }),
    } as never);

    await expect(controller.detail('beras-premium', { city: 'bandung' })).resolves.toMatchObject({
      product: { slug: 'beras-premium' },
      cityAverages: [{ citySlug: 'bandung', averageUnitPrice: 14000 }],
    });
  });
});
