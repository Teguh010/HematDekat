import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../auth/zod-validation.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';

const moderationStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

type AdminRequest = Request & { user?: { role?: 'USER' | 'ADMIN' } };

@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  async requireAdmin(req: AdminRequest): Promise<void> {
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  async getPendingItems() {
    const [priceReports, promos] = await Promise.all([
      this.prisma.priceReport.findMany({
        where: { status: 'PENDING' },
        include: {
          product: true,
          store: true,
          reporter: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promo.findMany({
        where: { status: 'PENDING' },
        include: {
          product: true,
          store: true,
          submitter: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const items = [
      ...priceReports.map((report) => ({
        kind: 'price-report',
        id: report.id,
        status: report.status,
        product: report.product.name,
        store: report.store.name,
        reporter: report.reporter?.name ?? report.reporter?.email ?? 'Anonymous',
        price: report.price,
        unit: report.unit,
        normalizedUnitPrice: report.normalizedUnitPrice,
        createdAt: report.createdAt,
      })),
      ...promos.map((promo) => ({
        kind: 'promo',
        id: promo.id,
        status: promo.status,
        product: promo.product.name,
        store: promo.store.name,
        submitter: promo.submitter?.name ?? promo.submitter?.email ?? 'Anonymous',
        promoPrice: promo.promoPrice,
        discountPct: promo.discountPct,
        createdAt: promo.createdAt,
      })),
    ];

    return { items };
  }

  @Get('pending')
  async getPending(@Req() req: AdminRequest) {
    await this.requireAdmin(req);
    return this.getPendingItems();
  }

  @Patch('price-reports/:id/status')
  async updatePriceReportStatus(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderationStatusSchema)) body: z.infer<typeof moderationStatusSchema>,
  ) {
    await this.requireAdmin(req);

    const report = await this.prisma.priceReport.update({
      where: { id },
      data: {
        status: body.status,
        verifiedAt: new Date(),
      },
      include: {
        product: true,
        store: true,
        reporter: true,
      },
    });

    await this.prisma.activity.create({
      data: {
        type: body.status === 'APPROVED' ? 'PRICE_REPORT_APPROVED' : 'PRICE_REPORT_REJECTED',
        userId: report.reporterId ?? undefined,
        storeId: report.storeId,
        productId: report.productId,
        priceReportId: report.id,
      },
    });

    return {
      id: report.id,
      status: report.status,
      message: `Price report ${body.status.toLowerCase()}`,
    };
  }

  @Patch('promos/:id/status')
  async updatePromoStatus(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderationStatusSchema)) body: z.infer<typeof moderationStatusSchema>,
  ) {
    await this.requireAdmin(req);

    const promo = await this.prisma.promo.update({
      where: { id },
      data: { status: body.status },
      include: {
        product: true,
        store: true,
        submitter: true,
      },
    });

    await this.prisma.activity.create({
      data: {
        type: body.status === 'APPROVED' ? 'PROMO_APPROVED' : 'PROMO_REJECTED',
        userId: promo.submitterId ?? undefined,
        storeId: promo.storeId,
        productId: promo.productId,
        promoId: promo.id,
      },
    });

    return {
      id: promo.id,
      status: promo.status,
      message: `Promo ${body.status.toLowerCase()}`,
    };
  }
}
