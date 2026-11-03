import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../prisma/prisma.service.js';
import { SavedStoresService } from './saved-stores.service.js';

function makeSavedStoreRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    store: {
      id: 'store-1',
      slug: 'toko-anyar',
      name: 'Toko Anyar',
      type: 'MARKET',
      city: { slug: 'bandung', name: 'Bandung' },
      district: 'Sukajadi',
      lat: -6.9,
      lng: 107.6,
      priceReports: [],
      promos: [],
      ...overrides,
    },
  };
}

describe('SavedStoresService', () => {
  it('lists saved stores mapped to StoreSummaryDto, newest first', async () => {
    const findMany = vi.fn().mockResolvedValue([makeSavedStoreRow()]);
    const prisma = { savedStore: { findMany } } as unknown as PrismaService;

    const items = await new SavedStoresService(prisma).list('user-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' }, orderBy: { createdAt: 'desc' } }),
    );
    expect(items).toEqual([
      expect.objectContaining({ id: 'store-1', slug: 'toko-anyar', name: 'Toko Anyar' }),
    ]);
  });

  it('saves a store by upserting the join row (idempotent)', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const prisma = {
      store: { findUnique: vi.fn().mockResolvedValue({ id: 'store-1', slug: 'toko-anyar' }) },
      savedStore: { upsert },
    } as unknown as PrismaService;

    await new SavedStoresService(prisma).save('user-1', 'toko-anyar');

    expect(upsert).toHaveBeenCalledWith({
      where: { userId_storeId: { userId: 'user-1', storeId: 'store-1' } },
      update: {},
      create: { userId: 'user-1', storeId: 'store-1' },
    });
  });

  it('throws NotFoundException when saving an unknown store slug', async () => {
    const prisma = {
      store: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    await expect(new SavedStoresService(prisma).save('user-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('unsaves a store (idempotent delete)', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      store: { findUnique: vi.fn().mockResolvedValue({ id: 'store-1', slug: 'toko-anyar' }) },
      savedStore: { deleteMany },
    } as unknown as PrismaService;

    await new SavedStoresService(prisma).unsave('user-1', 'toko-anyar');

    expect(deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1', storeId: 'store-1' } });
  });

  it('throws NotFoundException when unsaving an unknown store slug', async () => {
    const prisma = {
      store: { findUnique: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    await expect(new SavedStoresService(prisma).unsave('user-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
