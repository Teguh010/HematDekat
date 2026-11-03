import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import type { PrismaService } from '../prisma/prisma.service.js';
import { LeaderboardService } from './leaderboard.service.js';

describe('LeaderboardService', () => {
  it('throws NotFoundException for an unknown city slug', async () => {
    const prisma = {
      city: { findUnique: async () => null },
    } as unknown as PrismaService;

    await expect(
      new LeaderboardService(prisma).getLeaderboard({ period: 'all', citySlug: 'missing-city' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ranks rows in the order the query returns them and never includes an email', async () => {
    const prisma = {
      $queryRaw: async () => [
        { userId: 'user-1', points: 25 },
        { userId: 'user-2', points: 11 },
      ],
      user: {
        findMany: async () => [
          { id: 'user-1', name: 'Dewi' },
          { id: 'user-2', name: null },
        ],
      },
    } as unknown as PrismaService;

    const items = await new LeaderboardService(prisma).getLeaderboard({ period: 'all' });

    expect(items).toEqual([
      { rank: 1, userId: 'user-1', displayName: 'Dewi', points: 25 },
      { rank: 2, userId: 'user-2', displayName: 'Kontributor #er-2', points: 11 },
    ]);
    expect(JSON.stringify(items)).not.toContain('@');
  });

  it('returns an empty list when nobody has points yet', async () => {
    const prisma = {
      $queryRaw: async () => [],
    } as unknown as PrismaService;

    const items = await new LeaderboardService(prisma).getLeaderboard({ period: 'week' });

    expect(items).toEqual([]);
  });

  it('resolves a city slug to a cityId before querying', async () => {
    let queriedCityId: string | undefined;

    const prisma = {
      city: { findUnique: async () => ({ id: 'city-1', slug: 'jakarta' }) },
      $queryRaw: async (sql: { values: unknown[] }) => {
        queriedCityId = sql.values.find((value) => value === 'city-1') as string | undefined;
        return [];
      },
    } as unknown as PrismaService;

    await new LeaderboardService(prisma).getLeaderboard({ period: 'all', citySlug: 'jakarta' });

    expect(queriedCityId).toBe('city-1');
  });
});
