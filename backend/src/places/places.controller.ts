import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../auth/zod-validation.pipe.js';

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
  @Get('autocomplete')
  async autocomplete(@Query(new ZodValidationPipe(autocompleteSchema)) query: z.infer<typeof autocompleteSchema>) {
    const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY;

    if (!apiKey) {
      return {
        status: 'not-configured',
        predictions: [],
        message: 'Google Places server key is not configured.',
      };
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', query.input);
    url.searchParams.set('language', query.language);
    url.searchParams.set('components', 'country:id');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url);
    return response.json();
  }

  @Get('details')
  async details(@Query(new ZodValidationPipe(detailsSchema)) query: z.infer<typeof detailsSchema>) {
    const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY;

    if (!apiKey) {
      return {
        status: 'not-configured',
        result: null,
        message: 'Google Places server key is not configured.',
      };
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', query.place_id);
    url.searchParams.set('language', query.language);
    url.searchParams.set('fields', 'place_id,name,formatted_address,geometry,types');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url);
    return response.json();
  }
}
