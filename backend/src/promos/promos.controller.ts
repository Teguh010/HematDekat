import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.service.js';
import { UserThrottlerGuard } from '../common/user-throttler.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PromosService } from './promos.service.js';

const storeTypeSchema = z.enum(['supermarket', 'minimarket', 'market', 'grocery-stall']);

const promoSchema = z
  .object({
    storeSlug: z.string().trim().min(1).optional(),
    placeId: z.string().trim().min(1).optional(),
    storeType: storeTypeSchema.optional(),
    productSlug: z.string().trim().min(1),
    promoPrice: z.coerce.number().int().min(100).max(10_000_000).optional(),
    discountPct: z.coerce.number().int().min(1).max(90).optional(),
    conditions: z.string().trim().max(200).optional(),
    validFrom: z.coerce.date(),
    validTo: z.coerce.date(),
  })
  .superRefine((value, ctx) => {
    const hasPromoPrice = value.promoPrice != null;
    const hasDiscountPct = value.discountPct != null;
    const hasStoreSlug = Boolean(value.storeSlug);
    const hasPlaceId = Boolean(value.placeId);

    if (hasPromoPrice === hasDiscountPct) {
      ctx.addIssue({
        code: 'custom',
        message: 'Exactly one of promoPrice or discountPct is required',
        path: ['promoPrice'],
      });
    }

    if (hasStoreSlug === hasPlaceId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Exactly one of storeSlug or placeId is required',
        path: ['storeSlug'],
      });
    }

    if (value.placeId && !value.storeType) {
      ctx.addIssue({
        code: 'custom',
        message: 'storeType is required when placeId is provided',
        path: ['storeType'],
      });
    }

    if (value.validTo < value.validFrom) {
      ctx.addIssue({
        code: 'custom',
        message: 'validTo must be on or after validFrom',
        path: ['validTo'],
      });
    }

    const diffDays = (value.validTo.getTime() - value.validFrom.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      ctx.addIssue({
        code: 'custom',
        message: 'validTo must be within 90 days of validFrom',
        path: ['validTo'],
      });
    }
  });

@Controller('promos')
@UseGuards(JwtAuthGuard)
export class PromosController {
  constructor(private readonly promos: PromosService) {}

  @Post()
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60 * 60_000 } })
  create(
    @Body(new ZodValidationPipe(promoSchema)) body: z.infer<typeof promoSchema>,
    @Req() req: Request & { user?: AuthUser },
  ) {
    if (!req.user) {
      throw new Error('Authenticated user is required');
    }

    return this.promos.create({
      userId: req.user.id,
      ...body,
    });
  }
}
