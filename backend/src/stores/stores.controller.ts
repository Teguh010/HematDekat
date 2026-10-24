import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../auth/zod-validation.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';

const storeQuerySchema = z.object({
  city: z.string().optional(),
  search: z.string().optional(),
  product: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

@Controller('stores')
export class StoresController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query(new ZodValidationPipe(storeQuerySchema)) query: z.infer<typeof storeQuerySchema>) {
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

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const store = await this.prisma.store.findUnique({
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

    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }

    return store;
  }
}
