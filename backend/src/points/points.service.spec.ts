import { describe, expect, it } from 'vitest';
import type { Prisma, PointEventType } from '@prisma/client';

import type { PrismaService } from '../prisma/prisma.service.js';
import { PointsService } from './points.service.js';

type StoredEvent = {
  userId: string;
  type: PointEventType;
  points: number;
  sourceId: string;
  createdAt: Date;
};

type CreateArgs = { data: { userId: string; type: PointEventType; points: number; sourceId: string } };
type FindUniqueArgs = { where: { type_sourceId: { type: PointEventType; sourceId: string } } };
type CountArgs = { where: { userId: string; type: PointEventType; createdAt: { gte: Date } } };

function createFakeTx() {
  const events: StoredEvent[] = [];

  const tx = {
    pointEvent: {
      create: async ({ data }: CreateArgs) => {
        const exists = events.some((event) => event.type === data.type && event.sourceId === data.sourceId);
        if (exists) {
          const error = new Error('duplicate') as Error & { code: string };
          error.code = 'P2002';
          throw error;
        }
        const event: StoredEvent = { ...data, createdAt: new Date() };
        events.push(event);
        return event;
      },
      findUnique: async ({ where }: FindUniqueArgs) =>
        events.find(
          (event) => event.type === where.type_sourceId.type && event.sourceId === where.type_sourceId.sourceId,
        ) ?? null,
      count: async ({ where }: CountArgs) =>
        events.filter(
          (event) =>
            event.userId === where.userId && event.type === where.type && event.createdAt >= where.createdAt.gte,
        ).length,
    },
  } as unknown as Prisma.TransactionClient;

  return { tx, events };
}

describe('PointsService', () => {
  it('awards points for an approved price report', async () => {
    const { tx, events } = createFakeTx();
    const service = new PointsService({} as unknown as PrismaService);

    await service.awardPriceReportApproved(tx, 'user-1', 'report-1');

    expect(events).toMatchObject([{ userId: 'user-1', type: 'PRICE_REPORT_APPROVED', points: 10, sourceId: 'report-1' }]);
  });

  it('awards points for an approved promo', async () => {
    const { tx, events } = createFakeTx();
    const service = new PointsService({} as unknown as PrismaService);

    await service.awardPromoApproved(tx, 'user-1', 'promo-1');

    expect(events).toMatchObject([{ userId: 'user-1', type: 'PROMO_APPROVED', points: 5, sourceId: 'promo-1' }]);
  });

  it('does not double-award the same report', async () => {
    const { tx, events } = createFakeTx();
    const service = new PointsService({} as unknown as PrismaService);

    await service.awardPriceReportApproved(tx, 'user-1', 'report-1');
    await service.awardPriceReportApproved(tx, 'user-1', 'report-1');

    expect(events).toHaveLength(1);
  });

  it('revokes points when an approved price report is later rejected', async () => {
    const { tx, events } = createFakeTx();
    const service = new PointsService({} as unknown as PrismaService);

    await service.awardPriceReportApproved(tx, 'user-1', 'report-1');
    await service.revokeApproval(tx, 'PRICE_REPORT_APPROVED', 'report-1');

    expect(events).toContainEqual(
      expect.objectContaining({ userId: 'user-1', type: 'REVOKED', points: -10, sourceId: 'report-1' }),
    );
  });

  it('does nothing when revoking an item that was never approved', async () => {
    const { tx, events } = createFakeTx();
    const service = new PointsService({} as unknown as PrismaService);

    await service.revokeApproval(tx, 'PRICE_REPORT_APPROVED', 'report-never-approved');

    expect(events).toEqual([]);
  });

  it('caps report-confirmed points at the first 20 confirmations for an item', async () => {
    const { tx, events } = createFakeTx();
    const service = new PointsService({} as unknown as PrismaService);

    await service.awardReportConfirmed(tx, 'owner-1', 20, 'vote-20');
    await service.awardReportConfirmed(tx, 'owner-1', 21, 'vote-21');

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ sourceId: 'vote-20', points: 1 });
  });

  it('caps vote-given points at 20 per day', async () => {
    const { tx, events } = createFakeTx();
    const service = new PointsService({} as unknown as PrismaService);

    for (let i = 0; i < 20; i += 1) {
      await service.awardVoteGiven(tx, 'voter-1', `vote-${i}`);
    }
    await service.awardVoteGiven(tx, 'voter-1', 'vote-21st');

    expect(events).toHaveLength(20);
  });

  it('sums total points for a user', async () => {
    const prisma = {
      pointEvent: { aggregate: async () => ({ _sum: { points: 23 } }) },
    } as unknown as PrismaService;

    expect(await new PointsService(prisma).getTotalPoints('user-1')).toBe(23);
  });

  it('returns 0 total points when there are no events', async () => {
    const prisma = {
      pointEvent: { aggregate: async () => ({ _sum: { points: null } }) },
    } as unknown as PrismaService;

    expect(await new PointsService(prisma).getTotalPoints('user-1')).toBe(0);
  });
});
