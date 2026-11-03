import { Injectable } from '@nestjs/common';
import type { Prisma, PointEventType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

type TxClient = Prisma.TransactionClient;

const POINTS_BY_TYPE = {
  PRICE_REPORT_APPROVED: 10,
  PROMO_APPROVED: 5,
  REPORT_CONFIRMED: 1,
  VOTE_GIVEN: 1,
} as const satisfies Partial<Record<PointEventType, number>>;

// A report or promo only earns "confirmed" points for its first 20 confirmations.
const REPORT_CONFIRMED_CAP = 20;
// A user only earns points for casting votes up to 20 times per calendar day.
const VOTE_GIVEN_DAILY_CAP = 20;

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalPoints(userId: string): Promise<number> {
    const result = await this.prisma.pointEvent.aggregate({
      where: { userId },
      _sum: { points: true },
    });

    return result._sum.points ?? 0;
  }

  async awardPriceReportApproved(tx: TxClient, userId: string, priceReportId: string): Promise<void> {
    await this.createIfAbsent(tx, {
      userId,
      type: 'PRICE_REPORT_APPROVED',
      points: POINTS_BY_TYPE.PRICE_REPORT_APPROVED,
      sourceId: priceReportId,
    });
  }

  async awardPromoApproved(tx: TxClient, userId: string, promoId: string): Promise<void> {
    await this.createIfAbsent(tx, {
      userId,
      type: 'PROMO_APPROVED',
      points: POINTS_BY_TYPE.PROMO_APPROVED,
      sourceId: promoId,
    });
  }

  /** Reverses the approval award for an item that was approved and is now being rejected. No-op if it was never approved. */
  async revokeApproval(
    tx: TxClient,
    type: 'PRICE_REPORT_APPROVED' | 'PROMO_APPROVED',
    itemId: string,
  ): Promise<void> {
    const previous = await tx.pointEvent.findUnique({
      where: { type_sourceId: { type, sourceId: itemId } },
    });

    if (!previous) {
      return;
    }

    await this.createIfAbsent(tx, {
      userId: previous.userId,
      type: 'REVOKED',
      points: -previous.points,
      sourceId: itemId,
    });
  }

  /** Awards the item owner +1 for a confirmation vote, capped at the first 20 confirmations for that item. */
  async awardReportConfirmed(
    tx: TxClient,
    ownerId: string,
    confirmationCountAfterVote: number,
    voteId: string,
  ): Promise<void> {
    if (confirmationCountAfterVote > REPORT_CONFIRMED_CAP) {
      return;
    }

    await this.createIfAbsent(tx, {
      userId: ownerId,
      type: 'REPORT_CONFIRMED',
      points: POINTS_BY_TYPE.REPORT_CONFIRMED,
      sourceId: voteId,
    });
  }

  /** Awards the voter +1 for casting a vote on someone else's item, capped at 20 per calendar day. */
  async awardVoteGiven(tx: TxClient, voterId: string, voteId: string): Promise<void> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const awardedToday = await tx.pointEvent.count({
      where: { userId: voterId, type: 'VOTE_GIVEN', createdAt: { gte: startOfDay } },
    });

    if (awardedToday >= VOTE_GIVEN_DAILY_CAP) {
      return;
    }

    await this.createIfAbsent(tx, {
      userId: voterId,
      type: 'VOTE_GIVEN',
      points: POINTS_BY_TYPE.VOTE_GIVEN,
      sourceId: voteId,
    });
  }

  /** `@@unique([type, sourceId])` makes this idempotent: a repeat award for the same event is silently skipped. */
  private async createIfAbsent(
    tx: TxClient,
    data: { userId: string; type: PointEventType; points: number; sourceId: string },
  ): Promise<void> {
    try {
      await tx.pointEvent.create({ data });
    } catch (error) {
      if (!this.isDuplicateError(error)) {
        throw error;
      }
    }
  }

  private isDuplicateError(error: unknown): boolean {
    return Boolean((error as { code?: string } | null)?.code === 'P2002');
  }
}
