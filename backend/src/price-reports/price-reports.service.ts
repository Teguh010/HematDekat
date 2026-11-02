import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { toApiUnit } from '../common/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoresService } from '../stores/stores.service.js';

const OUTLIER_LOOKBACK_DAYS = 30;
const OUTLIER_MIN_SAMPLE_SIZE = 3;
const OUTLIER_LOW_RATIO = 0.5;
const OUTLIER_HIGH_RATIO = 2;

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function formatRupiah(value: number): string {
  return rupiahFormatter.format(value).replace(/\s/g, '');
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  return sorted[mid];
}

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
    const { flagged, flagReason } = await this.detectOutlier({
      productId: product.id,
      cityId: store.cityId,
      normalizedUnitPrice,
    });

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
          flagged,
          flagReason,
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

  private async detectOutlier(input: {
    productId: string;
    cityId: string;
    normalizedUnitPrice: number;
  }): Promise<{ flagged: boolean; flagReason: string | null }> {
    const cutoff = new Date(Date.now() - OUTLIER_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const recentApproved = await this.prisma.priceReport.findMany({
      where: {
        productId: input.productId,
        status: 'APPROVED',
        verifiedAt: { gte: cutoff },
        store: { cityId: input.cityId },
      },
      select: { normalizedUnitPrice: true },
    });

    if (recentApproved.length < OUTLIER_MIN_SAMPLE_SIZE) {
      return { flagged: false, flagReason: null };
    }

    const medianUnitPrice = median(recentApproved.map((report) => report.normalizedUnitPrice));
    const isOutlier =
      input.normalizedUnitPrice < medianUnitPrice * OUTLIER_LOW_RATIO ||
      input.normalizedUnitPrice > medianUnitPrice * OUTLIER_HIGH_RATIO;

    if (!isOutlier) {
      return { flagged: false, flagReason: null };
    }

    return {
      flagged: true,
      flagReason: `Unit price ${formatRupiah(input.normalizedUnitPrice)} vs median ${formatRupiah(medianUnitPrice)}`,
    };
  }
}

