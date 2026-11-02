import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

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

function createService(prisma: any) {
  return new VotesService(prisma);
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

  it('rejects requests that pass neither or both identifiers', async () => {
    await expect(createService({}).create({ userId: 'user-1' })).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(
      createService({}).create({ userId: 'user-1', priceReportId: 'a', promoId: 'b' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
