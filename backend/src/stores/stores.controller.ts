import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { StoresService } from './stores.service.js';

const storeQuerySchema = z.object({
  city: z.string().optional(),
  search: z.string().optional(),
  product: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

@Controller('stores')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Get()
  list(@Query(new ZodValidationPipe(storeQuerySchema)) query: z.infer<typeof storeQuerySchema>) {
    return this.stores.list(query);
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
