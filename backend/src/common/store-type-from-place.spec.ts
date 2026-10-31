import { describe, expect, it } from 'vitest';
import { districtFromAddressComponents, storeTypeFromPlace } from './store-type-from-place.js';

describe('storeTypeFromPlace', () => {
  it('maps the Places API type metadata to the app store types', () => {
    expect(
      storeTypeFromPlace({
        types: ['grocery_or_supermarket', 'supermarket'],
        primaryType: 'supermarket',
        displayName: { text: 'Super Indo' },
      }),
    ).toBe('supermarket');

    expect(
      storeTypeFromPlace({
        types: ['convenience_store'],
        primaryType: 'convenience_store',
        displayName: { text: 'Alfamart' },
      }),
    ).toBe('minimarket');

    expect(
      storeTypeFromPlace({
        types: ['market'],
        primaryType: 'market',
        displayName: { text: 'Pasar Tradisional' },
      }),
    ).toBe('market');
  });

  it('falls back to a store name keyword when Google types are generic', () => {
    expect(
      storeTypeFromPlace({
        types: ['food'],
        displayName: { text: 'Pasar Baru Kota' },
      }),
    ).toBe('market');

    expect(
      storeTypeFromPlace({
        types: ['store'],
        displayName: { text: 'Circle K Sudirman' },
      }),
    ).toBe('minimarket');
  });
});

describe('districtFromAddressComponents', () => {
  it('uses the first administrative district in priority order', () => {
    expect(
      districtFromAddressComponents([
        { longText: 'Jakarta Timur', types: ['administrative_area_level_1'] },
        { longText: 'Kramat Jati', types: ['administrative_area_level_3'] },
        { longText: 'Jakarta', types: ['locality'] },
      ]),
    ).toBe('Kramat Jati');

    expect(
      districtFromAddressComponents([
        { longText: 'Kelapa Gading', types: ['administrative_area_level_4'] },
      ]),
    ).toBe('Kelapa Gading');
  });

  it('returns null when no district-like component exists', () => {
    expect(
      districtFromAddressComponents([{ longText: 'Jakarta', types: ['locality'] }]),
    ).toBeNull();
  });
});
