import { describe, expect, it } from 'vitest';

import { StoresController } from './stores.controller.js';

describe('StoresController', () => {
  it('returns available false when Google Places lookup fails', async () => {
    const controller = new StoresController(
      {
        findBySlug: async () => ({ slug: 'pasar-sukajadi', placeId: 'abc' }),
      } as never,
      {
        getStorePageDetails: async () => null,
      } as never,
    );

    await expect(controller.getPlaceDetails('pasar-sukajadi')).resolves.toEqual({ available: false });
  });

  it('returns the normalized Places details payload when available', async () => {
    const controller = new StoresController(
      {
        findBySlug: async () => ({ slug: 'pasar-sukajadi', placeId: 'abc' }),
      } as never,
      {
        getStorePageDetails: async () => ({
          available: true,
          name: 'Pasar Sukajadi',
          rating: 4.5,
          userRatingCount: 120,
          formattedAddress: 'Jl. Sukajadi',
          photo: {
            uri: 'https://example.com/photo.jpg',
            attributions: [{ displayName: 'Google', uri: 'https://google.com' }],
          },
        }),
      } as never,
    );

    await expect(controller.getPlaceDetails('pasar-sukajadi')).resolves.toMatchObject({
      available: true,
      name: 'Pasar Sukajadi',
      rating: 4.5,
      userRatingCount: 120,
    });
  });
});
