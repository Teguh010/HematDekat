import { describe, expect, it } from 'vitest';

import type { AuthService } from '../auth/auth.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SavedStoresService } from '../saved-stores/saved-stores.service.js';
import { ProfileService } from './profile.service.js';

function approvedReport(daysAgo: number, storeType: 'MARKET' | 'SUPERMARKET' = 'SUPERMARKET') {
  const verifiedAt = new Date(Date.now() - daysAgo * 86_400_000);
  return {
    id: `report-${daysAgo}-${storeType}`,
    status: 'APPROVED',
    verifiedAt,
    createdAt: verifiedAt,
    store: { slug: 'toko', name: 'Toko', type: storeType },
    product: { slug: 'beras', name: 'Beras' },
  };
}

describe('ProfileService', () => {
  it('awards no badges for a brand new user', async () => {
    const prisma = {
      priceReport: { findMany: async () => [] },
      promo: { findMany: async () => [] },
      vote: { findMany: async () => [] },
      $queryRaw: async () => [],
    } as unknown as PrismaService;
    const auth = { getCurrentUser: async () => ({ id: 'u1', email: 'a@b.com', name: null, role: 'user', points: 0 }) } as unknown as AuthService;
    const savedStores = { list: async () => [] } as unknown as SavedStoresService;

    const profile = await new ProfileService(prisma, auth, savedStores).getProfile('u1');

    expect(profile.badges).toEqual([]);
    expect(profile.rank).toBeNull();
    expect(profile.savedStores).toEqual([]);
    expect(profile.reports).toEqual([]);
  });

  it('awards first-report and price-hunter at their thresholds, and market-expert only for market stores', async () => {
    const reports = [
      ...Array.from({ length: 9 }, (_, i) => approvedReport(20 - i, 'SUPERMARKET')),
      ...Array.from({ length: 10 }, (_, i) => approvedReport(10 - i, 'MARKET')),
    ];

    const prisma = {
      priceReport: { findMany: async () => reports },
      promo: { findMany: async () => [] },
      vote: { findMany: async () => [] },
      $queryRaw: async () => [],
    } as unknown as PrismaService;
    const auth = { getCurrentUser: async () => ({ id: 'u1', email: 'a@b.com', name: null, role: 'user', points: 100 }) } as unknown as AuthService;
    const savedStores = { list: async () => [] } as unknown as SavedStoresService;

    const profile = await new ProfileService(prisma, auth, savedStores).getProfile('u1');

    const keys = profile.badges.map((b) => b.key);
    expect(keys).toContain('first-report');
    expect(keys).toContain('price-hunter');
    expect(keys).toContain('market-expert');
    expect(keys).not.toContain('price-guardian');
  });

  it('awards price-guardian at 50 votes given', async () => {
    const votes = Array.from({ length: 50 }, (_, i) => ({ createdAt: new Date(Date.now() - (50 - i) * 1000) }));

    const prisma = {
      priceReport: { findMany: async () => [] },
      promo: { findMany: async () => [] },
      vote: { findMany: async () => votes },
      $queryRaw: async () => [],
    } as unknown as PrismaService;
    const auth = { getCurrentUser: async () => ({ id: 'u1', email: 'a@b.com', name: null, role: 'user', points: 50 }) } as unknown as AuthService;
    const savedStores = { list: async () => [] } as unknown as SavedStoresService;

    const profile = await new ProfileService(prisma, auth, savedStores).getProfile('u1');

    expect(profile.badges.map((b) => b.key)).toEqual(['price-guardian']);
  });

  it('computes rank from the position in the points ranking, or null if absent', async () => {
    const prisma = {
      priceReport: { findMany: async () => [] },
      promo: { findMany: async () => [] },
      vote: { findMany: async () => [] },
      $queryRaw: async () => [{ userId: 'other' }, { userId: 'u1' }],
    } as unknown as PrismaService;
    const auth = { getCurrentUser: async () => ({ id: 'u1', email: 'a@b.com', name: null, role: 'user', points: 5 }) } as unknown as AuthService;
    const savedStores = { list: async () => [] } as unknown as SavedStoresService;

    const profile = await new ProfileService(prisma, auth, savedStores).getProfile('u1');

    expect(profile.rank).toBe(2);
  });

  it('merges price reports and promos into one list sorted by newest first, capped at 50', async () => {
    const prisma = {
      priceReport: {
        findMany: async () => [
          {
            id: 'pr-1',
            status: 'APPROVED',
            createdAt: new Date('2026-01-02T00:00:00.000Z'),
            store: { slug: 'toko-a', name: 'Toko A' },
            product: { slug: 'beras', name: 'Beras' },
          },
        ],
      },
      vote: { findMany: async () => [] },
      promo: {
        findMany: async () => [
          {
            id: 'promo-1',
            status: 'PENDING',
            createdAt: new Date('2026-01-03T00:00:00.000Z'),
            store: { slug: 'toko-b', name: 'Toko B' },
            product: { slug: 'minyak', name: 'Minyak' },
          },
        ],
      },
      $queryRaw: async () => [],
    } as unknown as PrismaService;
    const auth = { getCurrentUser: async () => ({ id: 'u1', email: 'a@b.com', name: null, role: 'user', points: 10 }) } as unknown as AuthService;
    const savedStores = { list: async () => [] } as unknown as SavedStoresService;

    const profile = await new ProfileService(prisma, auth, savedStores).getProfile('u1');

    expect(profile.reports).toEqual([
      {
        id: 'promo-1',
        kind: 'promo',
        store: { slug: 'toko-b', name: 'Toko B' },
        product: { slug: 'minyak', name: 'Minyak' },
        status: 'pending',
        createdAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'pr-1',
        kind: 'price-report',
        store: { slug: 'toko-a', name: 'Toko A' },
        product: { slug: 'beras', name: 'Beras' },
        status: 'approved',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
  });
});
