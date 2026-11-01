import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/auth.service.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PriceReportsService } from './price-reports.service.js';

const storeTypeSchema = z.enum(['supermarket', 'minimarket', 'market', 'grocery-stall']);
const unitSchema = z.enum(['kg', 'liter', 'pcs', 'pack', 'tray']);

const priceReportSchema = z
  .object({
    storeSlug: z.string().trim().min(1).optional(),
    placeId: z.string().trim().min(1).optional(),
    storeType: storeTypeSchema.optional(),
    productSlug: z.string().trim().min(1),
    price: z.coerce.number().int().min(100).max(10_000_000),
    quantity: z.coerce.number().positive().refine((value) => Number(value.toFixed(3)) === value, {
      message: 'Quantity must have at most 3 decimal places',
    }),
    unit: unitSchema,
  })
  .superRefine((value, ctx) => {
    const hasStoreSlug = Boolean(value.storeSlug);
    const hasPlaceId = Boolean(value.placeId);

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
  });

@Controller('price-reports')
@UseGuards(JwtAuthGuard)
export class PriceReportsController {
  constructor(private readonly priceReports: PriceReportsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(priceReportSchema)) body: z.infer<typeof priceReportSchema>,
    @Req() req: Request & { user?: AuthUser },
  ) {
    if (!req.user) {
      throw new Error('Authenticated user is required');
    }

    return this.priceReports.create({
      userId: req.user.id,
      ...body,
    });
  }
}
