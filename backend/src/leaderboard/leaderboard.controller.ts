import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { LeaderboardService } from './leaderboard.service.js';

const leaderboardQuerySchema = z.object({
  period: z.enum(['week', 'month', 'all']).default('all'),
  city: z.string().trim().min(1).max(60).optional(),
});

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query(new ZodValidationPipe(leaderboardQuerySchema)) query: z.infer<typeof leaderboardQuerySchema>,
  ) {
    const items = await this.leaderboard.getLeaderboard({ period: query.period, citySlug: query.city });
    return { items };
  }
}
