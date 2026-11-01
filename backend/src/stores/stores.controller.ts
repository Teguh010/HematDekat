import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { z } from 'zod';
import { PlacesService } from '../places/places.service.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { StoresService } from './stores.service.js';

const storeTypeValues = ['supermarket', 'minimarket', 'market', 'grocery-stall'] as const;
const bboxStringSchema = z
  .string()
  .trim()
  .transform((value) => value.split(',').map((part) => Number(part.trim())))
  .refine((value) => value.length === 4 && value.every((num) => Number.isFinite(num)), {
    message: 'bbox must be four comma-separated numbers',
  })
  .transform((value) => [value[0], value[1], value[2], value[3]] as [number, number, number, number]);

const storeQuerySchema = z.object({
  city: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(60).optional(),
  // Keep accepting the old `search` param during the C3.4/C6 transition.
  search: z.string().trim().min(1).max(60).optional(),
  product: z.string().min(1).optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  maxPrice: z.coerce.number().int().min(1).max(10_000_000).optional(),
  promo: z.enum(['0', '1']).optional(),
  fresh: z.enum(['3', '14', '30']).optional(),
  sort: z.enum(['cheapest', 'nearest', 'recent']).optional(),
  lat: z.coerce.number().min(-11).max(6).optional(),
  lng: z.coerce.number().min(95).max(141).optional(),
  bbox: bboxStringSchema.optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

@Controller('stores')
export class StoresController {
  constructor(
    private readonly stores: StoresService,
    private readonly places: PlacesService,
  ) {}

  @Get(':slug/place-details')
  async getPlaceDetails(@Param('slug') slug: string) {
    const store = await this.stores.findBySlug(slug);

    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }

    const details = await this.places.getStorePageDetails(store.placeId);

    if (!details) {
      return { available: false };
    }

    return details;
  }

  @Get()
  list(@Query(new ZodValidationPipe(storeQuerySchema)) query: z.infer<typeof storeQuerySchema>) {
    const type =
      Array.isArray(query.type)
        ? query.type
        : typeof query.type === 'string'
          ? query.type.split(',').map((value) => value.trim()).filter(Boolean)
          : undefined;

    return this.stores.list({
      city: query.city,
      q: query.q ?? query.search,
      product: query.product,
      type: type?.filter((value): value is (typeof storeTypeValues)[number] =>
        storeTypeValues.includes(value as (typeof storeTypeValues)[number]),
      ),
      maxPrice: query.maxPrice,
      promo: query.promo === '1',
      fresh: query.fresh ? Number(query.fresh) as 3 | 14 | 30 : undefined,
      sort: query.sort,
      lat: query.lat,
      lng: query.lng,
      bbox: query.bbox,
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
