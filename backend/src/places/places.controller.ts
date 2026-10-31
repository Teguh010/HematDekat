import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { PlacesService } from './places.service.js';

const autocompleteSchema = z.object({
  input: z.string().trim().min(3).max(100),
  sessionToken: z.string().uuid(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  language: z.string().default('id'),
});

const detailsSchema = z.object({
  placeId: z.string().min(1),
  sessionToken: z.string().uuid(),
  language: z.string().default('id'),
});

@Controller('places')
@UseGuards(JwtAuthGuard)
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get('autocomplete')
  autocomplete(@Query(new ZodValidationPipe(autocompleteSchema)) query: z.infer<typeof autocompleteSchema>) {
    return this.places.autocomplete(query);
  }

  @Get('details')
  details(@Query(new ZodValidationPipe(detailsSchema)) query: z.infer<typeof detailsSchema>) {
    return this.places.lookup(query);
  }
}
