import { describe, expect, it } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AdminController } from './admin.controller.js';

describe('AdminController', () => {
  it('returns pending items in the public shape, newest first', async () => {
    const prisma = {
      priceReport: {
        findMany: async () => [
          {
            id: 'report-1',
            price: 15000,
            quantity: 1,
            normalizedUnitPrice: 15000,
            createdAt: new Date('2026-10-01T00:00:00.000Z'),
            product: { slug: 'beras-premium', name: 'Beras premium', defaultUnit: 'KG' },
            store: { slug: 'pasar-kramat-jati', name: 'Pasar Kramat Jati' },
            reporter: { name: 'Rina', email: 'rina@example.com' },
          },
        ],
      },
      promo: {
        findMany: async () => [
          {
            id: 'promo-1',
            promoPrice: 16000,
            discountPct: null,
            validFrom: new Date('2026-10-30T00:00:00.000Z'),
            validTo: new Date('2026-11-13T00:00:00.000Z'),
            createdAt: new Date('2026-10-30T00:00:00.000Z'),
            product: { slug: 'minyak-goreng-curah', name: 'Minyak goreng curah', defaultUnit: 'LITER' },
            store: { slug: 'mitra-grocery', name: 'Mitra Grocery' },
            submitter: { name: null, email: 'doni@example.com' },
          },
        ],
      },
    } as unknown as PrismaService;

    const pending = await new AdminController(prisma).getPendingItems();

    expect(pending.map((item) => item.id)).toEqual(['promo-1', 'report-1']);
    expect(pending[0]).toMatchObject({
      kind: 'promo',
      submittedBy: 'doni',
      store: { slug: 'mitra-grocery', name: 'Mitra Grocery' },
      product: { defaultUnit: 'liter' },
      flagged: false,
    });
    expect(pending[1]).toMatchObject({
      kind: 'price-report',
      submittedBy: 'Rina',
      price: 15000,
      product: { defaultUnit: 'kg' },
    });
  });
});
