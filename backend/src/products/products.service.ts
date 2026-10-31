import { Injectable } from '@nestjs/common';
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
    const where: Record<string, unknown> = {};

    if (query.category) {
      where.category = query.category.toUpperCase();
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
    });
  }
}
