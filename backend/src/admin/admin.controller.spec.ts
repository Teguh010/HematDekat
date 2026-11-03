import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { PointsService } from '../points/points.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminService } from './admin.service.js';

const noopPoints = {} as unknown as PointsService;

function createPointsSpy() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const points = {
    awardPriceReportApproved: async (...args: unknown[]) => {
      calls.push({ method: 'awardPriceReportApproved', args });
    },
    awardPromoApproved: async (...args: unknown[]) => {
      calls.push({ method: 'awardPromoApproved', args });
    },
    revokeApproval: async (...args: unknown[]) => {
      calls.push({ method: 'revokeApproval', args });
    },
  } as unknown as PointsService;

  return { points, calls };
}

describe('AdminService', () => {
  it('returns pending items in the public shape, newest first', async () => {
    const prisma = {
      priceReport: {
        findMany: async () => [
          {
            id: 'report-1',
            price: 15000,
            quantity: 1,
            normalizedUnitPrice: 15000,
            createdAt: new Date('2026-10-01T00:00:00.000Z'),
            flagged: false,
            flagReason: null,
            product: { slug: 'beras-premium', name: 'Beras premium', defaultUnit: 'KG' },
            store: { slug: 'pasar-kramat-jati', name: 'Pasar Kramat Jati' },
            reporter: { name: 'Rina', email: 'rina@example.com' },
          },
        ],
      },
      promo: {
        findMany: async () => [
          {
            id: 'promo-1',
            promoPrice: 16000,
            discountPct: null,
            validFrom: new Date('2026-10-30T00:00:00.000Z'),
            validTo: new Date('2026-11-13T00:00:00.000Z'),
            createdAt: new Date('2026-10-30T00:00:00.000Z'),
            product: { slug: 'minyak-goreng-curah', name: 'Minyak goreng curah', defaultUnit: 'LITER' },
            store: { slug: 'mitra-grocery', name: 'Mitra Grocery' },
            submitter: { name: null, email: 'doni@example.com' },
          },
        ],
      },
    } as unknown as PrismaService;

    const pending = await new AdminService(prisma, noopPoints).listPending();

    expect(pending.map((item) => item.id)).toEqual(['promo-1', 'report-1']);
    expect(pending[0]).toMatchObject({
      kind: 'promo',
      submittedBy: 'doni',
      store: { slug: 'mitra-grocery', name: 'Mitra Grocery' },
      product: { defaultUnit: 'liter' },
      flagged: false,
    });
    expect(pending[1]).toMatchObject({
      kind: 'price-report',
      submittedBy: 'Rina',
      price: 15000,
      product: { defaultUnit: 'kg' },
    });
  });

  it('puts flagged price reports before newer unflagged items', async () => {
    const prisma = {
      priceReport: {
        findMany: async () => [
          {
            id: 'report-newer',
            price: 20000,
            quantity: 1,
            normalizedUnitPrice: 20000,
            createdAt: new Date('2026-10-31T00:00:00.000Z'),
            flagged: false,
            flagReason: null,
            product: { slug: 'beras-premium', name: 'Beras premium', defaultUnit: 'KG' },
            store: { slug: 'pasar-kramat-jati', name: 'Pasar Kramat Jati' },
            reporter: { name: 'Rina', email: 'rina@example.com' },
          },
          {
            id: 'report-flagged',
            price: 50000,
            quantity: 1,
            normalizedUnitPrice: 50000,
            createdAt: new Date('2026-10-01T00:00:00.000Z'),
            flagged: true,
            flagReason: 'Unit price Rp50.000 vs median Rp15.000',
            product: { slug: 'beras-premium', name: 'Beras premium', defaultUnit: 'KG' },
            store: { slug: 'pasar-kramat-jati', name: 'Pasar Kramat Jati' },
            reporter: { name: 'Doni', email: 'doni@example.com' },
          },
        ],
      },
      promo: {
        findMany: async () => [],
      },
    } as unknown as PrismaService;

    const pending = await new AdminService(prisma, noopPoints).listPending();

    expect(pending.map((item) => item.id)).toEqual(['report-flagged', 'report-newer']);
    expect(pending[0]).toMatchObject({
      flagged: true,
      flagReason: 'Unit price Rp50.000 vs median Rp15.000',
    });
  });
});

describe('AdminService status updates', () => {
  function createTxPrisma(options: { existingStatus: 'PENDING' | 'APPROVED'; reporterId: string | null }) {
    return {
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          priceReport: {
            findUnique: async () => ({
              id: 'report-1',
              status: options.existingStatus,
              reporterId: options.reporterId,
              storeId: 'store-1',
              productId: 'product-1',
            }),
            update: async ({ data }: { data: Record<string, unknown> }) => ({
              id: 'report-1',
              reporterId: options.reporterId,
              storeId: 'store-1',
              productId: 'product-1',
              ...data,
            }),
          },
          activity: { create: async () => undefined },
        };

        return callback(tx);
      },
    } as unknown as PrismaService;
  }

  it('awards points when approving a price report', async () => {
    const { points, calls } = createPointsSpy();
    const prisma = createTxPrisma({ existingStatus: 'PENDING', reporterId: 'user-1' });

    const result = await new AdminService(prisma, points).setPriceReportStatus('report-1', 'approved');

    expect(result).toEqual({ id: 'report-1', status: 'approved' });
    expect(calls).toEqual([
      { method: 'awardPriceReportApproved', args: [expect.anything(), 'user-1', 'report-1'] },
    ]);
  });

  it('revokes points when rejecting a previously approved price report', async () => {
    const { points, calls } = createPointsSpy();
    const prisma = createTxPrisma({ existingStatus: 'APPROVED', reporterId: 'user-1' });

    await new AdminService(prisma, points).setPriceReportStatus('report-1', 'rejected');

    expect(calls.map((call) => call.method)).toEqual(['revokeApproval']);
  });

  it('does not touch points when rejecting an already-pending price report', async () => {
    const { points, calls } = createPointsSpy();
    const prisma = createTxPrisma({ existingStatus: 'PENDING', reporterId: 'user-1' });

    await new AdminService(prisma, points).setPriceReportStatus('report-1', 'rejected');

    expect(calls).toEqual([]);
  });

  it('throws NotFoundException for a missing price report', async () => {
    const prisma = {
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({ priceReport: { findUnique: async () => null } }),
    } as unknown as PrismaService;

    await expect(
      new AdminService(prisma, noopPoints).setPriceReportStatus('missing', 'approved'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
