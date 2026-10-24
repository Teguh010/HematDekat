import { describe, expect, it } from 'vitest';

import { AdminController } from './admin.controller.js';

describe('AdminController', () => {
  it('collects pending moderation items from both reports and promos', async () => {
    const prisma = {
      priceReport: {
        findMany: async () => [
          { id: 'report-1', price: 15000, status: 'PENDING', product: { name: 'Beras premium' }, store: { name: 'Pasar Kramat Jati' }, reporter: { name: 'Rina' } },
        ],
      },
      promo: {
        findMany: async () => [
          { id: 'promo-1', status: 'PENDING', product: { name: 'Minyak goreng curah' }, store: { name: 'Mitra Grocery' }, submitter: { name: 'Doni' } },
        ],
      },
    } as any;

    const controller = new AdminController(prisma as any);
    const pending = await controller.getPendingItems();

    expect(pending.items).toHaveLength(2);
    expect(pending.items.some((item) => item.kind === 'price-report')).toBeTruthy();
    expect(pending.items.some((item) => item.kind === 'promo')).toBeTruthy();
  });

  it('rejects non-admin requests', async () => {
    const controller = new AdminController({} as any);
    await expect(
      controller.requireAdmin({ user: { role: 'USER' } }),
    ).rejects.toThrow('Admin access required');
  });
});
