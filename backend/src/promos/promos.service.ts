import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoresService } from '../stores/stores.service.js';

export type PromoSubmissionInput = {
  userId: string;
  storeSlug?: string;
  placeId?: string;
  storeType?: 'supermarket' | 'minimarket' | 'market' | 'grocery-stall';
  productSlug: string;
  promoPrice?: number;
  discountPct?: number;
  conditions?: string;
  validFrom: Date;
  validTo: Date;
};

@Injectable()
export class PromosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stores: StoresService,
  ) {}

  async create(input: PromoSubmissionInput) {
    const product = await this.prisma.product.findUnique({
      where: { slug: input.productSlug },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug "${input.productSlug}" not found`);
    }

    const hasPromoPrice = input.promoPrice != null;
    const hasDiscountPct = input.discountPct != null;

    if (hasPromoPrice === hasDiscountPct) {
      throw new UnprocessableEntityException('Exactly one of promoPrice or discountPct is required');
    }

    if (input.validTo < input.validFrom) {
      throw new UnprocessableEntityException('validTo must be on or after validFrom');
    }

    const diffDays = (input.validTo.getTime() - input.validFrom.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      throw new UnprocessableEntityException('validTo must be within 90 days of validFrom');
    }

    const store = await this.stores.resolveForSubmission(input);

    const promo = await this.prisma.$transaction(async (tx) => {
      const createdPromo = await tx.promo.create({
        data: {
          storeId: store.id,
          productId: product.id,
          submitterId: input.userId,
          promoPrice: input.promoPrice ?? null,
          discountPct: input.discountPct ?? null,
          conditions: input.conditions?.trim() || null,
          validFrom: input.validFrom,
          validTo: input.validTo,
          status: 'PENDING',
        },
      });

      await tx.activity.create({
        data: {
          type: 'PROMO_SUBMITTED',
          userId: input.userId,
          storeId: store.id,
          productId: product.id,
          promoId: createdPromo.id,
        },
      });

      return createdPromo;
    });

    return { id: promo.id, status: 'pending' };
  }
}
