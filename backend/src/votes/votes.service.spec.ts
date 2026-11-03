import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { PointsService } from '../points/points.service.js';
import { VotesService } from './votes.service.js';

type PriceReportRecord = {
  id: string;
  reporterId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedAt: Date | null;
  confirmationCount: number;
  storeId: string;
  productId: string;
};

type PromoRecord = {
  id: string;
  submitterId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  validFrom: Date;
  validTo: Date;
  storeId: string;
  productId: string;
};

function createPointsSpy() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const points = {
    awardReportConfirmed: async (...args: unknown[]) => {
      calls.push({ method: 'awardReportConfirmed', args });
    },
    awardVoteGiven: async (...args: unknown[]) => {
      calls.push({ method: 'awardVoteGiven', args });
    },
  } as unknown as PointsService;

  return { points, calls };
}

function createService(prisma: any, points: PointsService = createPointsSpy().points) {
  return new VotesService(prisma, points);
}

describe('VotesService', () => {
  it('creates a vote for an approved price report and updates its confirmation count', async () => {
    const report: PriceReportRecord = {
      id: 'report-1',
      reporterId: 'user-2',
      status: 'APPROVED',
      verifiedAt: null,
      confirmationCount: 0,
      storeId: 'store-1',
      productId: 'product-1',
    };

    const prisma = {
      priceReport: {
        findUnique: async ({ where }: { where: { id: string } }) => report,
      },
      vote: {
        create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'vote-1', ...data }),
      },
      $transaction: async (callback: (tx: any) => Promise<any>) => {
        const tx = {
          vote: {
            create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'vote-1', ...data }),
          },
          priceReport: {
            update: async ({ data }: { data: Record<string, unknown> }) => ({
              id: report.id,
              ...report,
              ...data,
              confirmationCount: report.confirmationCount + 1,
              verifiedAt: new Date(),
            }),
          },
          activity: {
            create: async ({ data }: { data: Record<string, unknown> }) => data,
          },
        };

        return callback(tx);
      },
    };

    const result = await createService(prisma).create({ userId: 'user-1', priceReportId: 'report-1' });

    expect(result.confirmationCount).toBeGreaterThanOrEqual(1);
    expect(result.verifiedAt).toBeTruthy();
  });

  it('rejects voting on your own price report', async () => {
    const prisma = {
      priceReport: {
        findUnique: async () => ({
          id: 'report-2',
          reporterId: 'user-1',
          status: 'APPROVED',
          verifiedAt: null,
          confirmationCount: 0,
          storeId: 'store-1',
          productId: 'product-1',
        }),
      },
    };

    await expect(createService(prisma).create({ userId: 'user-1', priceReportId: 'report-2' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns 404 for an unapproved or inactive promo', async () => {
    const prisma = {
      promo: {
        findUnique: async () => ({
          id: 'promo-1',
          submitterId: 'user-2',
          status: 'PENDING',
          validFrom: new Date('2025-01-01'),
          validTo: new Date('2025-01-10'),
          storeId: 'store-1',
          productId: 'product-1',
        }),
      },
    };

    await expect(createService(prisma).create({ userId: 'user-1', promoId: 'promo-1' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects duplicates with a 409 conflict', async () => {
    const prisma = {
      priceReport: {
        findUnique: async () => ({
          id: 'report-3',
          reporterId: 'user-2',
          status: 'APPROVED',
          verifiedAt: null,
          confirmationCount: 1,
          storeId: 'store-1',
          productId: 'product-1',
        }),
      },
      $transaction: async () => {
        const error = new Error('dup');
        (error as any).code = 'P2002';
        throw error;
      },
    };

    await expect(createService(prisma).create({ userId: 'user-1', priceReportId: 'report-3' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('awards the report owner and the voter points when confirming a price report', async () => {
    const report: PriceReportRecord = {
      id: 'report-4',
      reporterId: 'user-2',
      status: 'APPROVED',
      verifiedAt: null,
      confirmationCount: 0,
      storeId: 'store-1',
      productId: 'product-1',
    };

    const prisma = {
      priceReport: {
        findUnique: async () => report,
      },
      $transaction: async (callback: (tx: any) => Promise<any>) => {
        const tx = {
          vote: {
            create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'vote-4', ...data }),
          },
          priceReport: {
            update: async ({ data }: { data: Record<string, unknown> }) => ({
              ...report,
              ...data,
              confirmationCount: report.confirmationCount + 1,
              verifiedAt: new Date(),
            }),
          },
          activity: {
            create: async ({ data }: { data: Record<string, unknown> }) => data,
          },
        };

        return callback(tx);
      },
    };

    const { points, calls } = createPointsSpy();
    await createService(prisma, points).create({ userId: 'user-1', priceReportId: 'report-4' });

    expect(calls).toEqual([
      { method: 'awardReportConfirmed', args: [expect.anything(), 'user-2', 1, 'vote-4'] },
      { method: 'awardVoteGiven', args: [expect.anything(), 'user-1', 'vote-4'] },
    ]);
  });

  it('awards the promo owner and the voter points when confirming a promo', async () => {
    const promo: PromoRecord = {
      id: 'promo-2',
      submitterId: 'user-2',
      status: 'APPROVED',
      validFrom: new Date('2025-01-01'),
      validTo: new Date('2099-01-10'),
      storeId: 'store-1',
      productId: 'product-1',
    };

    const prisma = {
      promo: {
        findUnique: async () => promo,
      },
      $transaction: async (callback: (tx: any) => Promise<any>) => {
        const tx = {
          vote: {
            create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 'vote-5', ...data }),
            count: async () => 1,
          },
          activity: {
            create: async ({ data }: { data: Record<string, unknown> }) => data,
          },
        };

        return callback(tx);
      },
    };

    const { points, calls } = createPointsSpy();
    await createService(prisma, points).create({ userId: 'user-1', promoId: 'promo-2' });

    expect(calls).toEqual([
      { method: 'awardReportConfirmed', args: [expect.anything(), 'user-2', 1, 'vote-5'] },
      { method: 'awardVoteGiven', args: [expect.anything(), 'user-1', 'vote-5'] },
    ]);
  });

  it('rejects requests that pass neither or both identifiers', async () => {
    await expect(createService({}).create({ userId: 'user-1' })).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(
      createService({}).create({ userId: 'user-1', priceReportId: 'a', promoId: 'b' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
