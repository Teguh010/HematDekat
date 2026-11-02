import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { toApiUnit } from '../common/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoresService } from '../stores/stores.service.js';

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
    private readonly stores: StoresService,
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

    const store = await this.stores.resolveForSubmission(input);
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
}

