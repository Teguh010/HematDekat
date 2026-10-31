import { Injectable } from '@nestjs/common';

export type AutocompleteQuery = {
  input: string;
  language: string;
};

export type PlaceDetailsQuery = {
  place_id: string;
  language: string;
};

@Injectable()
export class PlacesService {
  async autocomplete(query: AutocompleteQuery) {
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

  async details(query: PlaceDetailsQuery) {
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
