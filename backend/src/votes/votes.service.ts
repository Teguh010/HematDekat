import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { PointsService } from '../points/points.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type VoteInput = {
  userId: string;
  priceReportId?: string;
  promoId?: string;
};

@Injectable()
export class VotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  async create(input: VoteInput) {
    const hasPriceReport = input.priceReportId != null;
    const hasPromo = input.promoId != null;

    if (hasPriceReport === hasPromo) {
      throw new UnprocessableEntityException('Exactly one of priceReportId or promoId is required');
    }

    if (input.priceReportId) {
      return this.createPriceReportVote(input);
    }

    return this.createPromoVote(input);
  }

  private async createPriceReportVote(input: VoteInput) {
    const report = await this.prisma.priceReport.findUnique({
      where: { id: input.priceReportId },
    });

    if (!report || report.status !== 'APPROVED') {
      throw new NotFoundException(`Price report with id "${input.priceReportId}" not found`);
    }

    if (report.reporterId === input.userId) {
      throw new ForbiddenException('You cannot confirm your own report');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const vote = await tx.vote.create({
          data: {
            userId: input.userId,
            priceReportId: input.priceReportId,
          },
        });

        const updated = await tx.priceReport.update({
          where: { id: input.priceReportId },
          data: {
            confirmationCount: { increment: 1 },
            verifiedAt: new Date(),
          },
        });

        await tx.activity.create({
          data: {
            type: 'VOTE_CAST',
            userId: input.userId,
            storeId: report.storeId,
            productId: report.productId,
            priceReportId: report.id,
          },
        });

        if (report.reporterId) {
          await this.points.awardReportConfirmed(tx, report.reporterId, updated.confirmationCount, vote.id);
        }
        await this.points.awardVoteGiven(tx, input.userId, vote.id);

        return {
          confirmationCount: updated.confirmationCount,
          verifiedAt: updated.verifiedAt,
        };
      });

      return result;
    } catch (error) {
      if (this.isDuplicateError(error)) {
        throw new ConflictException('You have already voted on this price report');
      }
      throw error;
    }
  }

  private async createPromoVote(input: VoteInput) {
    const promo = await this.prisma.promo.findUnique({
      where: { id: input.promoId },
    });

    const now = new Date();
    if (!promo || promo.status !== 'APPROVED' || promo.validFrom > now || promo.validTo < now) {
      throw new NotFoundException(`Promo with id "${input.promoId}" not found`);
    }

    if (promo.submitterId === input.userId) {
      throw new ForbiddenException('You cannot confirm your own promo');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const vote = await tx.vote.create({
          data: {
            userId: input.userId,
            promoId: input.promoId,
          },
        });

        const confirmationCount = await tx.vote.count({
          where: { promoId: input.promoId },
        });

        await tx.activity.create({
          data: {
            type: 'VOTE_CAST',
            userId: input.userId,
            storeId: promo.storeId,
            productId: promo.productId,
            promoId: promo.id,
          },
        });

        if (promo.submitterId) {
          await this.points.awardReportConfirmed(tx, promo.submitterId, confirmationCount, vote.id);
        }
        await this.points.awardVoteGiven(tx, input.userId, vote.id);

        return {
          confirmationCount,
          verifiedAt: null,
        };
      });

      return result;
    } catch (error) {
      if (this.isDuplicateError(error)) {
        throw new ConflictException('You have already voted on this promo');
      }
      throw error;
    }
  }

  private isDuplicateError(error: unknown): boolean {
    return Boolean((error as { code?: string } | null)?.code === 'P2002');
  }
}
