import { describe, expect, it } from 'vitest';

import { slugify } from '../src/common/slugify.js';
import { citySeeds, productCatalog } from './seed';

describe('database seed catalog', () => {
  it('creates stable slugs for city and product names', () => {
    expect(slugify('Pasar Kramat Jati')).toBe('pasar-kramat-jati');
    expect(slugify('Minyak Goreng Curah')).toBe('minyak-goreng-curah');
  });

  it('contains the intended city and product seeds for the MVP', () => {
    expect(citySeeds.map((city) => city.name)).toContain('Jakarta');
    expect(citySeeds.map((city) => city.name)).toContain('Bandung');
    expect(citySeeds.map((city) => city.name)).toContain('Surabaya');
    expect(productCatalog.map((product) => product.name)).toContain('Beras premium');
    expect(productCatalog.map((product) => product.name)).toContain('Minyak goreng curah');
    expect(productCatalog.map((product) => product.name)).toContain('Gula pasir');
  });
});
