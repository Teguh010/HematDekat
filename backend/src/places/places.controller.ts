import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PlacesService } from './places.service.js';

const autocompleteSchema = z.object({
  input: z.string().min(2),
  language: z.string().default('id'),
});

const detailsSchema = z.object({
  place_id: z.string().min(1),
  language: z.string().default('id'),
});

@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get('autocomplete')
  autocomplete(@Query(new ZodValidationPipe(autocompleteSchema)) query: z.infer<typeof autocompleteSchema>) {
    return this.places.autocomplete(query);
  }

  @Get('details')
  details(@Query(new ZodValidationPipe(detailsSchema)) query: z.infer<typeof detailsSchema>) {
    return this.places.details(query);
  }
}
