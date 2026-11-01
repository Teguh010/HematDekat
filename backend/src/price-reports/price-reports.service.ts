import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { slugify } from '../common/slugify.js';
import { haversineKm } from '../common/geo.js';
import { toApiUnit, toDbStoreType } from '../common/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PlacesService } from '../places/places.service.js';

export type PriceReportSubmissionInput = {
  userId: string;
  storeSlug?: string;
  placeId?: string;
  storeType?: 'supermarket' | 'minimarket' | 'market' | 'grocery-stall';
  productSlug: string;
  price: number;
  quantity: number;
  unit: 'kg' | 'liter' | 'pcs' | 'pack' | 'tray';
};

@Injectable()
export class PriceReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly places: PlacesService,
  ) {}

  async create(input: PriceReportSubmissionInput) {
    const product = await this.prisma.product.findUnique({
      where: { slug: input.productSlug },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${input.productSlug}" not found`);
    }

    const expectedUnit = toApiUnit(product.defaultUnit);
    if (input.unit !== expectedUnit) {
      throw new UnprocessableEntityException(`Unit must be ${expectedUnit}`);
    }

    const store = await this.resolveStoreForSubmission(input);
    const normalizedUnitPrice = Math.round(input.price / input.quantity);

    const report = await this.prisma.$transaction(async (tx) => {
      const createdReport = await tx.priceReport.create({
        data: {
          storeId: store.id,
          productId: product.id,
          reporterId: input.userId,
          price: input.price,
          quantity: input.quantity,
          unit: product.defaultUnit,
          normalizedUnitPrice,
          status: 'PENDING',
          verifiedAt: null,
          confirmationCount: 0,
        },
      });

      await tx.activity.create({
        data: {
          type: 'PRICE_REPORT_SUBMITTED',
          userId: input.userId,
          storeId: store.id,
          productId: product.id,
          priceReportId: createdReport.id,
        },
      });

      return createdReport;
    });

    return { id: report.id, status: 'pending' };
  }

  private async resolveStoreForSubmission(input: PriceReportSubmissionInput) {
    if (input.storeSlug) {
      const store = await this.prisma.store.findUnique({
        where: { slug: input.storeSlug },
        include: { city: true },
      });

      if (!store) {
        throw new NotFoundException(`Store with slug "${input.storeSlug}" not found`);
      }

      return store;
    }

    if (!input.placeId) {
      throw new NotFoundException('Either storeSlug or placeId is required');
    }

    const lookup = await this.prisma.store.findUnique({
      where: { placeId: input.placeId },
      include: { city: true },
    });

    if (lookup) {
      return lookup;
    }

    const place = await this.places.lookup({
      placeId: input.placeId,
      sessionToken: crypto.randomUUID(),
    });

    if (!place) {
      throw new NotFoundException(`Place with id "${input.placeId}" not found`);
    }

    const cities = await this.prisma.city.findMany({
      select: { id: true, slug: true, name: true, centerLat: true, centerLng: true },
    });

    let nearestCity: (typeof cities)[number] | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const city of cities) {
      const distance = haversineKm(place.lat, place.lng, city.centerLat, city.centerLng);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCity = city;
      }
    }

    if (!nearestCity || nearestDistance > 50) {
      throw new UnprocessableEntityException('Store is outside supported cities');
    }

    const baseSlug = slugify(`${place.name} ${place.district ?? nearestCity.name}`) || 'new-store';
    let slug = baseSlug;
    let index = 2;

    while (await this.prisma.store.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }

    const created = await this.prisma.store.create({
      data: {
        slug,
        name: place.name,
        placeId: place.placeId,
        type: toDbStoreType(input.storeType ?? 'grocery-stall'),
        cityId: nearestCity.id,
        district: place.district ?? null,
        lat: place.lat,
        lng: place.lng,
        fetchedAt: new Date(),
      },
      include: { city: true },
    });

    return created;
  }
}
