import { Controller, Get, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { ProductsService } from './products.service.js';

const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const productDetailQuerySchema = z.object({
  city: z.string().optional(),
});

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(productQuerySchema)) query: z.infer<typeof productQuerySchema>) {
    return this.products.list(query);
  }

  @Get(':slug')
  detail(
    @Param('slug') slug: string,
    @Query(new ZodValidationPipe(productDetailQuerySchema)) query: z.infer<typeof productDetailQuerySchema>,
  ) {
    return this.products.detail(slug, query);
  }
}
