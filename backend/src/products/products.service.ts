import { Injectable, NotFoundException } from '@nestjs/common';

import { activePromoWhere, currentPriceOrderBy, toProductDto, toStoreSummary } from '../common/dto.js';
import { toDbCategory } from '../common/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type ProductListQuery = {
  category?: string;
  search?: string;
  limit: number;
};

export type ProductDetailQuery = {
  city?: string;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ProductListQuery) {
    const now = new Date();
    const where: Record<string, unknown> = {
      OR: [
        { priceReports: { some: { status: 'APPROVED' } } },
        { promos: { some: activePromoWhere(now) } },
      ],
    };

    if (query.category) {
      const categoryKey = query.category.trim().toLowerCase();
      if (categoryKey in { rice: 'RICE', 'cooking-oil': 'COOKING_OIL', sugar: 'SUGAR', eggs: 'EGGS', flour: 'FLOUR', salt: 'SALT', 'instant-noodles': 'INSTANT_NOODLES', chili: 'CHILI', shallots: 'SHALLOTS', garlic: 'GARLIC', chicken: 'CHICKEN', beef: 'BEEF', fish: 'FISH' }) {
        where.category = toDbCategory(categoryKey as never);
      }
    }

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      take: query.limit,
    }).then((products) => products.map((product) => toProductDto(product)));
  }

  async detail(slug: string, query: ProductDetailQuery = {}) {
    const now = new Date();
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        priceReports: {
          where: { status: 'APPROVED' },
          orderBy: currentPriceOrderBy,
          include: {
            product: true,
            store: {
              include: {
                city: true,
                promos: {
                  where: activePromoWhere(now),
                  include: {
                    product: true,
                    _count: { select: { votes: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }

    const currentByStore = new Map<string, (typeof product.priceReports)[number]>();
    for (const report of product.priceReports) {
      if (!currentByStore.has(report.storeId)) {
        currentByStore.set(report.storeId, report);
      }
    }

    const currentReports = [...currentByStore.values()].filter((report) => {
      if (!query.city) {
        return true;
      }
      return report.store.city.slug === query.city;
    });

    const cheapest = currentReports
      .slice()
      .sort((a, b) => a.normalizedUnitPrice - b.normalizedUnitPrice || a.store.name.localeCompare(b.store.name))
      .slice(0, 20)
      .map((report) => ({
        ...toStoreSummary({
          ...report.store,
          city: report.store.city,
          priceReports: [report],
          promos: report.store.promos,
        }),
        distanceKm: null,
      }));

    const cityStats = new Map<string, { citySlug: string; cityName: string; total: number; count: number }>();
    for (const report of currentReports) {
      const city = report.store.city;
      const key = city.slug;
      const existing = cityStats.get(key);
      if (existing) {
        existing.total += report.normalizedUnitPrice;
        existing.count += 1;
      } else {
        cityStats.set(key, {
          citySlug: city.slug,
          cityName: city.name,
          total: report.normalizedUnitPrice,
          count: 1,
        });
      }
    }

    const cityAverages = [...cityStats.values()]
      .map((item) => ({
        citySlug: item.citySlug,
        cityName: item.cityName,
        averageUnitPrice: Math.round(item.total / item.count),
        reportCount: item.count,
      }))
      .sort((a, b) => a.averageUnitPrice - b.averageUnitPrice);

    return {
      product: toProductDto(product),
      cheapest,
      cityAverages,
    };
  }
}
