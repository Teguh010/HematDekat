import { Injectable } from '@nestjs/common';
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

  list(query: StoreListQuery) {
    const where: Record<string, unknown> = {};

    if (query.city) {
      where.city = { slug: query.city };
    }

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.product) {
      where.priceReports = {
        some: {
          product: {
            slug: query.product,
          },
        },
      };
    }

    return this.prisma.store.findMany({
      where,
      include: {
        city: true,
        priceReports: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { product: true },
        },
      },
      orderBy: { name: 'asc' },
      take: query.limit,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.store.findUnique({
      where: { slug },
      include: {
        city: true,
        priceReports: {
          orderBy: { createdAt: 'desc' },
          include: { product: true },
        },
        promos: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
