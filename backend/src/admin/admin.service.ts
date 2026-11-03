import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, ProductUnit } from '@prisma/client';
import { PointsService } from '../points/points.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const unitToApi = {
  KG: 'kg',
  LITER: 'liter',
  PCS: 'pcs',
  PACK: 'pack',
  TRAY: 'tray',
} as const satisfies Record<ProductUnit, string>;

export type PendingItem = {
  kind: 'price-report' | 'promo';
  id: string;
  store: { slug: string; name: string };
  product: { slug: string; name: string; defaultUnit: (typeof unitToApi)[ProductUnit] };
  submittedBy: string;
  price: number | null;
  quantity: number | null;
  normalizedUnitPrice: number | null;
  promoPrice: number | null;
  discountPct: number | null;
  validFrom: string | null;
  validTo: string | null;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
};

function submittedBy(person: { name: string | null; email: string } | null): string {
  if (!person) {
    return 'Anonymous';
  }

  return person.name ?? person.email.split('@')[0] ?? 'Anonymous';
}

function toPrismaStatus(status: 'approved' | 'rejected'): 'APPROVED' | 'REJECTED' {
  return status === 'approved' ? 'APPROVED' : 'REJECTED';
}

const pendingInclude = {
  product: true,
  store: true,
} satisfies Prisma.PriceReportInclude;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly points: PointsService,
  ) {}

  async listPending(): Promise<PendingItem[]> {
    const [priceReports, promos] = await Promise.all([
      this.prisma.priceReport.findMany({
        where: { status: 'PENDING' },
        include: { ...pendingInclude, reporter: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promo.findMany({
        where: { status: 'PENDING' },
        include: { ...pendingInclude, submitter: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const items: PendingItem[] = [
      ...priceReports.map((report) => ({
        kind: 'price-report' as const,
        id: report.id,
        store: { slug: report.store.slug, name: report.store.name },
        product: {
          slug: report.product.slug,
          name: report.product.name,
          defaultUnit: unitToApi[report.product.defaultUnit],
        },
        submittedBy: submittedBy(report.reporter),
        price: report.price,
        quantity: report.quantity,
        normalizedUnitPrice: report.normalizedUnitPrice,
        promoPrice: null,
        discountPct: null,
        validFrom: null,
        validTo: null,
        flagged: report.flagged,
        flagReason: report.flagReason,
        createdAt: report.createdAt.toISOString(),
      })),
      ...promos.map((promo) => ({
        kind: 'promo' as const,
        id: promo.id,
        store: { slug: promo.store.slug, name: promo.store.name },
        product: {
          slug: promo.product.slug,
          name: promo.product.name,
          defaultUnit: unitToApi[promo.product.defaultUnit],
        },
        submittedBy: submittedBy(promo.submitter),
        price: null,
        quantity: null,
        normalizedUnitPrice: null,
        promoPrice: promo.promoPrice,
        discountPct: promo.discountPct,
        validFrom: promo.validFrom.toISOString(),
        validTo: promo.validTo.toISOString(),
        flagged: false,
        flagReason: null,
        createdAt: promo.createdAt.toISOString(),
      })),
    ];

    return items.sort((a, b) => {
      if (a.flagged !== b.flagged) {
        return a.flagged ? -1 : 1;
      }

      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  async setPriceReportStatus(id: string, status: 'approved' | 'rejected') {
    const prismaStatus = toPrismaStatus(status);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.priceReport.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Price report with id "${id}" not found`);
      }

      const report = await tx.priceReport.update({
        where: { id },
        data: {
          status: prismaStatus,
          ...(prismaStatus === 'APPROVED' ? { verifiedAt: new Date() } : {}),
        },
      });

      await tx.activity.create({
        data: {
          type: prismaStatus === 'APPROVED' ? 'PRICE_REPORT_APPROVED' : 'PRICE_REPORT_REJECTED',
          userId: report.reporterId ?? undefined,
          storeId: report.storeId,
          productId: report.productId,
          priceReportId: report.id,
        },
      });

      if (prismaStatus === 'APPROVED' && report.reporterId) {
        await this.points.awardPriceReportApproved(tx, report.reporterId, report.id);
      } else if (prismaStatus === 'REJECTED' && existing.status === 'APPROVED') {
        await this.points.revokeApproval(tx, 'PRICE_REPORT_APPROVED', report.id);
      }

      return { id: report.id, status };
    });
  }

  async setPromoStatus(id: string, status: 'approved' | 'rejected') {
    const prismaStatus = toPrismaStatus(status);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.promo.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Promo with id "${id}" not found`);
      }

      const promo = await tx.promo.update({
        where: { id },
        data: { status: prismaStatus },
      });

      await tx.activity.create({
        data: {
          type: prismaStatus === 'APPROVED' ? 'PROMO_APPROVED' : 'PROMO_REJECTED',
          userId: promo.submitterId ?? undefined,
          storeId: promo.storeId,
          productId: promo.productId,
          promoId: promo.id,
        },
      });

      if (prismaStatus === 'APPROVED' && promo.submitterId) {
        await this.points.awardPromoApproved(tx, promo.submitterId, promo.id);
      } else if (prismaStatus === 'REJECTED' && existing.status === 'APPROVED') {
        await this.points.revokeApproval(tx, 'PROMO_APPROVED', promo.id);
      }

      return { id: promo.id, status };
    });
  }
}
