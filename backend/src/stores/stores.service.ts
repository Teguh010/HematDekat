import { Injectable } from '@nestjs/common';

import { activePromoWhere, currentPriceOrderBy, publicStoreWhere, toStoreDetail, toStoreSummary } from '../common/dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type StoreListQuery = {
  city?: string;
  search?: string;
  product?: string;
  limit: number;
};

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: StoreListQuery) {
    const now = new Date();

    const stores = await this.prisma.store.findMany({
      where: {
        AND: [
          publicStoreWhere(now),
          query.city ? { city: { slug: query.city } } : {},
          query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {},
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
      },
      include: {
        city: true,
        priceReports: {
          where: { status: 'APPROVED' },
          orderBy: currentPriceOrderBy,
          take: 10,
          include: { product: true },
        },
        promos: {
          where: activePromoWhere(now),
          orderBy: { validFrom: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
      take: query.limit,
    });

    return stores.map(toStoreSummary);
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
          take: 20,
          include: { product: true },
        },
        promos: {
          where: activePromoWhere(now),
          orderBy: { validFrom: 'desc' },
        },
      },
    });

    return store ? toStoreDetail(store) : null;
  }
}
