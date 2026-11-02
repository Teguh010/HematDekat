import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { z } from 'zod';

import type { AuthUser } from '../auth/auth.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UserThrottlerGuard } from '../common/user-throttler.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { VotesService } from './votes.service.js';

const voteSchema = z
  .object({
    priceReportId: z.string().trim().min(1).optional(),
    promoId: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    const hasPriceReportId = Boolean(value.priceReportId);
    const hasPromoId = Boolean(value.promoId);

    if (hasPriceReportId === hasPromoId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Exactly one of priceReportId or promoId is required',
        path: ['priceReportId'],
      });
    }
  });

@Controller('votes')
@UseGuards(JwtAuthGuard)
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @Post()
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60 * 60_000 } })
  create(
    @Body(new ZodValidationPipe(voteSchema)) body: z.infer<typeof voteSchema>,
    @Req() req: Request & { user?: AuthUser },
  ) {
    if (!req.user) {
      throw new Error('Authenticated user is required');
    }

    return this.votes.create({
      userId: req.user.id,
      ...body,
    });
  }
}
