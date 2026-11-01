import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import {
  activePromoWhere,
  currentPriceOrderBy,
  type PageDto,
  publicStoreWhere,
  type StoreSummaryDto,
  toStoreDetail,
  toStoreSummary,
} from '../common/dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type StoreListQuery = {
  city?: string;
  q?: string;
  product?: string;
  offset: number;
  limit: number;
};

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: StoreListQuery): Promise<PageDto<StoreSummaryDto>> {
    const now = new Date();
    const where: Prisma.StoreWhereInput = {
      AND: [
        publicStoreWhere(now),
        query.city ? { city: { slug: query.city } } : {},
        query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: 'insensitive' } },
                { district: { contains: query.q, mode: 'insensitive' } },
              ],
            }
          : {},
        query.product
          ? {
              priceReports: {
                some: {
                  status: 'APPROVED',
                  product: { slug: query.product },
                },
              },
            }
          : {},
      ],
    };

    const [total, stores] = await Promise.all([
      this.prisma.store.count({ where }),
      this.prisma.store.findMany({
        where,
        include: {
          city: true,
          priceReports: {
            where: {
              status: 'APPROVED',
              ...(query.product ? { product: { slug: query.product } } : { id: { in: [] } }),
            },
            orderBy: currentPriceOrderBy,
            take: 1,
            include: { product: true },
          },
          promos: {
            where: activePromoWhere(now),
            orderBy: { validTo: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
        skip: query.offset,
        take: query.limit,
      }),
    ]);

    return {
      items: stores.map(toStoreSummary),
      total,
      offset: query.offset,
      limit: query.limit,
    };
  }

  async findBySlug(slug: string) {
    const now = new Date();
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        city: true,
        priceReports: {
          where: { status: 'APPROVED' },
          orderBy: currentPriceOrderBy,
          include: { product: true },
        },
        promos: {
          where: activePromoWhere(now),
          orderBy: { validTo: 'asc' },
          include: {
            product: true,
            _count: { select: { votes: true } },
          },
        },
      },
    });

    if (!store) {
      return null;
    }

    // A store is public only when it has at least one approved report or active promo.
    if (store.priceReports.length === 0 && store.promos.length === 0) {
      return null;
    }

    return toStoreDetail(store);
  }
}
