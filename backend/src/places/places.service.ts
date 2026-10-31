import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service.js';
import { districtFromAddressComponents, storeTypeFromPlace } from '../common/store-type-from-place.js';

export type AutocompleteQuery = {
  input: string;
  sessionToken: string;
  lat?: number;
  lng?: number;
  language?: string;
};

export type PlaceLookupQuery = {
  placeId: string;
  sessionToken: string;
  language?: string;
};

const googlePlaceSuggestionSchema = z.object({
  placePrediction: z.object({
    placeId: z.string().min(1),
    structuredFormat: z.object({
      mainText: z.object({ text: z.string().min(1) }),
      secondaryText: z.object({ text: z.string() }).optional(),
    }),
  }),
});

const googlePlaceDetailsSchema = z.object({
  id: z.string().min(1),
  displayName: z.object({ text: z.string().min(1) }).optional(),
  formattedAddress: z.string().nullable().optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  types: z.array(z.string()).optional(),
  primaryType: z.string().optional(),
  addressComponents: z
    .array(
      z.object({
        longText: z.string().optional(),
        shortText: z.string().optional(),
        types: z.array(z.string()),
      }),
    )
    .optional(),
});

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  private getApiKey(): string {
    const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY?.trim();

    if (!apiKey) {
      throw new HttpException({ message: 'Places is not configured' }, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return apiKey;
  }

  async autocomplete(query: AutocompleteQuery) {
    try {
      const apiKey = this.getApiKey();
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
        },
        body: JSON.stringify({
          input: query.input,
          sessionToken: query.sessionToken,
          languageCode: query.language ?? 'id',
          regionCode: 'id',
          includedRegionCodes: ['id'],
          ...(query.lat !== undefined && query.lng !== undefined
            ? { locationBias: { circle: { center: { latitude: query.lat, longitude: query.lng }, radius: 20000 } } }
            : {}),
        }),
      });

      if (!response.ok) {
        return [];
      }

      const payload = await response.json();
      const suggestions = z
        .object({ suggestions: z.array(googlePlaceSuggestionSchema).optional() })
        .parse(payload)
        .suggestions?.slice(0, 5) ?? [];

      return suggestions.map((suggestion) => ({
        placeId: suggestion.placePrediction.placeId,
        mainText: suggestion.placePrediction.structuredFormat.mainText.text,
        secondaryText: suggestion.placePrediction.structuredFormat.secondaryText?.text ?? null,
      }));
    } catch {
      return [];
    }
  }

  async lookup(query: PlaceLookupQuery) {
    try {
      const apiKey = this.getApiKey();
      const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(query.placeId)}`);
      url.searchParams.set('languageCode', query.language ?? 'id');
      url.searchParams.set('regionCode', 'id');
      url.searchParams.set('sessionToken', query.sessionToken);

      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,primaryType,addressComponents',
        },
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      const details = googlePlaceDetailsSchema.parse(payload);
      const placeId = details.id;
      const existingStore = await this.prisma.store.findUnique({
        where: { placeId },
        select: { slug: true },
      });

      return {
        placeId,
        name: details.displayName?.text ?? 'Unknown place',
        lat: details.location?.latitude ?? 0,
        lng: details.location?.longitude ?? 0,
        formattedAddress: details.formattedAddress ?? null,
        district: districtFromAddressComponents(details.addressComponents),
        suggestedType: storeTypeFromPlace({
          types: details.types,
          primaryType: details.primaryType,
          displayName: details.displayName,
        }),
        existingStoreSlug: existingStore?.slug ?? null,
      };
    } catch {
      return null;
    }
  }
}
