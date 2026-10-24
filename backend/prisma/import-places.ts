import { PrismaClient, StoreType } from '@prisma/client';

import { citySeeds, createPrismaClient, slugify } from './seed';

type GooglePrediction = {
  place_id?: string;
  description?: string;
};

type GooglePlaceLocation = {
  lat?: number;
  lng?: number;
};

type GooglePlaceResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: GooglePlaceLocation;
  };
};

export async function importPlacesForCity(cityName: string, prisma = createPrismaClient()): Promise<number> {
  const apiKey = process.env.GOOGLE_PLACES_SERVER_KEY;

  if (!apiKey) {
    console.warn(`Skipping Places import for ${cityName}: GOOGLE_PLACES_SERVER_KEY is not configured.`);
    return 0;
  }

  const city = await prisma.city.findFirst({
    where: { name: cityName },
  });

  if (!city) {
    console.warn(`Skipping Places import for ${cityName}: city not found in the database.`);
    return 0;
  }

  const queries = [cityName, `${cityName} pasar`, `${cityName} supermarket`, `${cityName} minimarket`];
  const seen = new Set<string>();
  let imported = 0;

  for (const query of queries) {
    const autocompleteResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:id&types=establishment&key=${apiKey}`,
    );

    if (!autocompleteResponse.ok) {
      continue;
    }

    const autocompletePayload = (await autocompleteResponse.json()) as {
      predictions?: GooglePrediction[];
    };

    for (const prediction of autocompletePayload.predictions ?? []) {
      if (!prediction.place_id || seen.has(prediction.place_id)) {
        continue;
      }

      seen.add(prediction.place_id);

      const detailsResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(prediction.place_id)}&fields=place_id,name,formatted_address,geometry&key=${apiKey}`,
      );

      if (!detailsResponse.ok) {
        continue;
      }

      const detailsPayload = (await detailsResponse.json()) as {
        result?: GooglePlaceResult;
      };

      const place = detailsPayload.result;

      if (!place?.place_id || !place.geometry?.location) {
        continue;
      }

      const storeName = place.name ?? prediction.description ?? `${cityName} Store`;
      const district = place.formatted_address?.split(',').slice(-3, -2)[0]?.trim() ?? city.name;

      await prisma.store.upsert({
        where: { placeId: place.place_id },
        update: {
          name: storeName,
          cityId: city.id,
          district,
          type: StoreType.MARKET,
          lat: place.geometry.location.lat ?? city.centerLat,
          lng: place.geometry.location.lng ?? city.centerLng,
          fetchedAt: new Date(),
        },
        create: {
          slug: slugify(storeName),
          name: storeName,
          placeId: place.place_id,
          cityId: city.id,
          district,
          type: StoreType.MARKET,
          lat: place.geometry.location.lat ?? city.centerLat,
          lng: place.geometry.location.lng ?? city.centerLng,
          fetchedAt: new Date(),
        },
      });

      imported += 1;
    }
  }

  return imported;
}

export async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    const target = process.argv[2] ?? 'all';

    if (target === 'all') {
      let total = 0;

      for (const city of citySeeds) {
        total += await importPlacesForCity(city.name, prisma);
      }

      console.log(`Imported Places data for ${total} stores.`);
      return;
    }

    const total = await importPlacesForCity(target, prisma);
    console.log(`Imported Places data for ${total} stores in ${target}.`);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectExecution = process.argv[1]?.includes('prisma/import-places.ts');

if (isDirectExecution) {
  void main();
}
