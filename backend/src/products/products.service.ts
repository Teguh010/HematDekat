import { Injectable } from '@nestjs/common';

import { activePromoWhere, toProductDto } from '../common/dto.js';
import { toDbCategory } from '../common/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type ProductListQuery = {
  category?: string;
  search?: string;
  limit: number;
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
}
