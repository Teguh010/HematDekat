import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';

export type LeaderboardPeriod = 'week' | 'month' | 'all';

export type LeaderboardItem = {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
};

const MAX_ITEMS = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

function periodStart(period: LeaderboardPeriod, now: Date): Date | null {
  if (period === 'week') {
    return new Date(now.getTime() - 7 * DAY_MS);
  }
  if (period === 'month') {
    return new Date(now.getTime() - 30 * DAY_MS);
  }
  return null;
}

function displayNameFor(user: { id: string; name: string | null }): string {
  const name = user.name?.trim();
  return name && name.length > 0 ? name : `Kontributor #${user.id.slice(-4)}`;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(params: { period: LeaderboardPeriod; citySlug?: string }): Promise<LeaderboardItem[]> {
    let cityId: string | null = null;

    if (params.citySlug) {
      const city = await this.prisma.city.findUnique({ where: { slug: params.citySlug } });
      if (!city) {
        throw new NotFoundException(`City "${params.citySlug}" not found`);
      }
      cityId = city.id;
    }

    const since = periodStart(params.period, new Date());

    // PointEvent has no store/city reference (see D1). Resolve each event's store by
    // walking its sourceId through the price report, promo, or vote it came from, then
    // join to the store's city. This runs once per request and is bounded by MAX_ITEMS
    // after grouping, which is fine at MVP scale.
    const rows = await this.prisma.$queryRaw<Array<{ userId: string; points: number }>>(Prisma.sql`
      SELECT pe."userId" AS "userId", SUM(pe."points")::int AS "points"
      FROM "PointEvent" pe
      LEFT JOIN "PriceReport" "prDirect" ON pe."type" = 'PRICE_REPORT_APPROVED' AND "prDirect"."id" = pe."sourceId"
      LEFT JOIN "Promo" "pmDirect" ON pe."type" = 'PROMO_APPROVED' AND "pmDirect"."id" = pe."sourceId"
      LEFT JOIN "PriceReport" "prRevoked" ON pe."type" = 'REVOKED' AND "prRevoked"."id" = pe."sourceId"
      LEFT JOIN "Promo" "pmRevoked" ON pe."type" = 'REVOKED' AND "pmRevoked"."id" = pe."sourceId"
      LEFT JOIN "Vote" v ON pe."type" IN ('REPORT_CONFIRMED', 'VOTE_GIVEN') AND v."id" = pe."sourceId"
      LEFT JOIN "PriceReport" "prViaVote" ON "prViaVote"."id" = v."priceReportId"
      LEFT JOIN "Promo" "pmViaVote" ON "pmViaVote"."id" = v."promoId"
      LEFT JOIN "Store" s ON s."id" = COALESCE(
        "prDirect"."storeId", "pmDirect"."storeId",
        "prRevoked"."storeId", "pmRevoked"."storeId",
        "prViaVote"."storeId", "pmViaVote"."storeId"
      )
      WHERE (${since}::timestamp IS NULL OR pe."createdAt" >= ${since})
        AND (${cityId}::text IS NULL OR s."cityId" = ${cityId})
      GROUP BY pe."userId"
      HAVING SUM(pe."points") > 0
      ORDER BY SUM(pe."points") DESC
      LIMIT ${MAX_ITEMS}
    `);

    if (rows.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((row) => row.userId) } },
      select: { id: true, name: true },
    });
    const userById = new Map(users.map((user) => [user.id, user]));

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      displayName: displayNameFor(userById.get(row.userId) ?? { id: row.userId, name: null }),
      points: row.points,
    }));
  }
}
