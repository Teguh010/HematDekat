import { Injectable, NotFoundException } from '@nestjs/common';

import { activePromoWhere, currentPriceOrderBy, type StoreSummaryDto, toStoreSummary } from '../common/dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SavedStoresService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<StoreSummaryDto[]> {
    const now = new Date();

    const saved = await this.prisma.savedStore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          include: {
            city: true,
            priceReports: {
              where: { status: 'APPROVED' },
              orderBy: currentPriceOrderBy,
              take: 1,
              include: { product: true },
            },
            promos: {
              where: activePromoWhere(now),
              orderBy: { validTo: 'asc' },
            },
          },
        },
      },
    });

    return saved.map((row) => toStoreSummary(row.store));
  }

  async save(userId: string, storeSlug: string): Promise<void> {
    const store = await this.findStoreBySlug(storeSlug);

    await this.prisma.savedStore.upsert({
      where: { userId_storeId: { userId, storeId: store.id } },
      update: {},
      create: { userId, storeId: store.id },
    });
  }

  async unsave(userId: string, storeSlug: string): Promise<void> {
    const store = await this.findStoreBySlug(storeSlug);

    await this.prisma.savedStore.deleteMany({
      where: { userId, storeId: store.id },
    });
  }

  private async findStoreBySlug(storeSlug: string) {
    const store = await this.prisma.store.findUnique({ where: { slug: storeSlug } });

    if (!store) {
      throw new NotFoundException(`Store "${storeSlug}" not found`);
    }

    return store;
  }
}
