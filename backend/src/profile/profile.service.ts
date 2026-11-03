import { Injectable } from '@nestjs/common';
import { Prisma, type ReportStatus } from '@prisma/client';

import type { CurrentUserDto } from '../auth/auth.service.js';
import { AuthService } from '../auth/auth.service.js';
import type { StoreSummaryDto } from '../common/dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SavedStoresService } from '../saved-stores/saved-stores.service.js';

export type ProfileBadgeKey = 'first-report' | 'price-hunter' | 'price-guardian' | 'market-expert';

export type ProfileBadgeDto = {
  key: ProfileBadgeKey;
  earnedAt: string;
};

export type ProfileReportStatus = 'pending' | 'approved' | 'rejected';

export type ProfileReportDto = {
  id: string;
  kind: 'price-report' | 'promo';
  store: { slug: string; name: string };
  product: { slug: string; name: string };
  status: ProfileReportStatus;
  createdAt: string;
};

export type ProfileDto = {
  user: CurrentUserDto;
  rank: number | null;
  badges: ProfileBadgeDto[];
  savedStores: StoreSummaryDto[];
  reports: ProfileReportDto[];
};

const MAX_REPORTS = 50;
const PRICE_HUNTER_THRESHOLD = 10;
const PRICE_GUARDIAN_THRESHOLD = 50;
const MARKET_EXPERT_THRESHOLD = 10;

function toApiReportStatus(status: ReportStatus): ProfileReportStatus {
  if (status === 'APPROVED') return 'approved';
  if (status === 'REJECTED') return 'rejected';
  return 'pending';
}

function earnedAtOf(item: { verifiedAt: Date | null; createdAt: Date }): string {
  return (item.verifiedAt ?? item.createdAt).toISOString();
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly savedStores: SavedStoresService,
  ) {}

  async getProfile(userId: string): Promise<ProfileDto> {
    const [user, rank, badges, savedStoresList, reports] = await Promise.all([
      this.auth.getCurrentUser(userId),
      this.getRank(userId),
      this.getBadges(userId),
      this.savedStores.list(userId),
      this.getReports(userId),
    ]);

    return { user, rank, badges, savedStores: savedStoresList, reports };
  }

  private async getRank(userId: string): Promise<number | null> {
    const rows = await this.prisma.$queryRaw<Array<{ userId: string }>>(Prisma.sql`
      SELECT pe."userId" AS "userId"
      FROM "PointEvent" pe
      GROUP BY pe."userId"
      HAVING SUM(pe."points") > 0
      ORDER BY SUM(pe."points") DESC
    `);

    const index = rows.findIndex((row) => row.userId === userId);
    return index === -1 ? null : index + 1;
  }

  private async getBadges(userId: string): Promise<ProfileBadgeDto[]> {
    const [approvedReports, votesGiven] = await Promise.all([
      this.prisma.priceReport.findMany({
        where: { reporterId: userId, status: 'APPROVED' },
        orderBy: [{ verifiedAt: 'asc' }, { createdAt: 'asc' }],
        include: { store: { select: { type: true } } },
      }),
      this.prisma.vote.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ]);

    const badges: ProfileBadgeDto[] = [];

    if (approvedReports.length >= 1) {
      badges.push({ key: 'first-report', earnedAt: earnedAtOf(approvedReports[0]) });
    }

    if (approvedReports.length >= PRICE_HUNTER_THRESHOLD) {
      badges.push({ key: 'price-hunter', earnedAt: earnedAtOf(approvedReports[PRICE_HUNTER_THRESHOLD - 1]) });
    }

    if (votesGiven.length >= PRICE_GUARDIAN_THRESHOLD) {
      badges.push({
        key: 'price-guardian',
        earnedAt: votesGiven[PRICE_GUARDIAN_THRESHOLD - 1].createdAt.toISOString(),
      });
    }

    const marketReports = approvedReports.filter((report) => report.store.type === 'MARKET');
    if (marketReports.length >= MARKET_EXPERT_THRESHOLD) {
      badges.push({
        key: 'market-expert',
        earnedAt: earnedAtOf(marketReports[MARKET_EXPERT_THRESHOLD - 1]),
      });
    }

    return badges;
  }

  private async getReports(userId: string): Promise<ProfileReportDto[]> {
    const [priceReports, promos] = await Promise.all([
      this.prisma.priceReport.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_REPORTS,
        include: { store: true, product: true },
      }),
      this.prisma.promo.findMany({
        where: { submitterId: userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_REPORTS,
        include: { store: true, product: true },
      }),
    ]);

    const merged: ProfileReportDto[] = [
      ...priceReports.map((report) => ({
        id: report.id,
        kind: 'price-report' as const,
        store: { slug: report.store.slug, name: report.store.name },
        product: { slug: report.product.slug, name: report.product.name },
        status: toApiReportStatus(report.status),
        createdAt: report.createdAt.toISOString(),
      })),
      ...promos.map((promo) => ({
        id: promo.id,
        kind: 'promo' as const,
        store: { slug: promo.store.slug, name: promo.store.name },
        product: { slug: promo.product.slug, name: promo.product.name },
        status: toApiReportStatus(promo.status),
        createdAt: promo.createdAt.toISOString(),
      })),
    ];

    return merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, MAX_REPORTS);
  }
}
