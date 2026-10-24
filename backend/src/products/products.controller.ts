import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../auth/zod-validation.pipe.js';
import { PrismaService } from '../prisma/prisma.service.js';

const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

@Controller('products')
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query(new ZodValidationPipe(productQuerySchema)) query: z.infer<typeof productQuerySchema>) {
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
