import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { StoresService } from './stores.service.js';

const storeQuerySchema = z.object({
  city: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(60).optional(),
  // Keep accepting the old `search` param during the C3.4/C6 transition.
  search: z.string().trim().min(1).max(60).optional(),
  product: z.string().min(1).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  list(@Query(new ZodValidationPipe(storeQuerySchema)) query: z.infer<typeof storeQuerySchema>) {
    return this.stores.list({
      city: query.city,
      q: query.q ?? query.search,
      product: query.product,
      offset: query.offset,
      limit: query.limit,
    });
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const store = await this.stores.findBySlug(slug);

    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }

    return store;
  }
}
