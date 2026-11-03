import { randomUUID } from 'node:crypto';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import request from 'supertest';
import { App } from 'supertest/types';

import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from './../src/app.module.js';

describe('GET /leaderboard', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  let userWithName: { id: string; email: string };
  let userNoName: { id: string; email: string };
  let citySlugA: string;
  let citySlugB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(passport.initialize());
    prisma = app.get(PrismaService);
    await app.init();

    const stores = await prisma.store.findMany({ include: { city: true }, take: 200 });
    const storeA = stores.find((store) => store.cityId === stores[0]?.cityId);
    const storeB = stores.find((store) => store.cityId !== stores[0]?.cityId);

    if (!storeA || !storeB) {
      throw new Error('Seeded database needs stores in at least two different cities for this test');
    }

    citySlugA = storeA.city.slug;
    citySlugB = storeB.city.slug;

    const product = await prisma.product.findFirst();
    if (!product) {
      throw new Error('No product found in the seeded database');
    }

    const suffix = randomUUID().slice(0, 8);

    const createdWithName = await prisma.user.create({
      data: {
        email: `leaderboard-named-${suffix}@example.com`,
        name: 'Dewi Leaderboard Test',
        passwordHash: 'unused',
        role: 'USER',
      },
    });
    const createdNoName = await prisma.user.create({
      data: {
        email: `leaderboard-anon-${suffix}@example.com`,
        name: null,
        passwordHash: 'unused',
        role: 'USER',
      },
    });
    userWithName = { id: createdWithName.id, email: createdWithName.email };
    userNoName = { id: createdNoName.id, email: createdNoName.email };

    const reportA = await prisma.priceReport.create({
      data: {
        storeId: storeA.id,
        productId: product.id,
        reporterId: userWithName.id,
        price: 15000,
        quantity: 1,
        unit: product.defaultUnit,
        normalizedUnitPrice: 15000,
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    });
    const reportB = await prisma.priceReport.create({
      data: {
        storeId: storeB.id,
        productId: product.id,
        reporterId: userNoName.id,
        price: 16000,
        quantity: 1,
        unit: product.defaultUnit,
        normalizedUnitPrice: 16000,
        status: 'APPROVED',
        verifiedAt: new Date(),
      },
    });

    // Inserted directly (bypassing AdminService/PointsService, whose awarding logic is
    // already unit-tested) so the points totals here are deterministic for this test.
    await prisma.pointEvent.create({
      data: { userId: userWithName.id, type: 'PRICE_REPORT_APPROVED', points: 10, sourceId: reportA.id },
    });
    await prisma.pointEvent.create({
      data: { userId: userNoName.id, type: 'PRICE_REPORT_APPROVED', points: 30, sourceId: reportB.id },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('orders contributors by points and never exposes email', async () => {
    const response = await request(app.getHttpServer()).get('/leaderboard?period=all').expect(200);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain(userWithName.email);
    expect(body).not.toContain(userNoName.email);
    expect(body).not.toContain('"email"');

    const items: Array<{ rank: number; userId: string; displayName: string; points: number }> = response.body.items;
    const named = items.find((item) => item.userId === userWithName.id);
    const anon = items.find((item) => item.userId === userNoName.id);

    expect(named).toMatchObject({ displayName: 'Dewi Leaderboard Test', points: 10 });
    expect(anon).toMatchObject({ points: 30 });
    expect(anon?.displayName).toContain('Kontributor #');
    expect(anon!.rank).toBeLessThan(named!.rank);
  });

  it('filters by city, resolving the store a point event belongs to', async () => {
    const onlyCityA = await request(app.getHttpServer())
      .get(`/leaderboard?period=all&city=${citySlugA}`)
      .expect(200);
    const itemsA: Array<{ userId: string }> = onlyCityA.body.items;
    expect(itemsA.some((item) => item.userId === userWithName.id)).toBe(true);
    expect(itemsA.some((item) => item.userId === userNoName.id)).toBe(false);

    const onlyCityB = await request(app.getHttpServer())
      .get(`/leaderboard?period=all&city=${citySlugB}`)
      .expect(200);
    const itemsB: Array<{ userId: string }> = onlyCityB.body.items;
    expect(itemsB.some((item) => item.userId === userNoName.id)).toBe(true);
    expect(itemsB.some((item) => item.userId === userWithName.id)).toBe(false);
  });

  it('returns 404 for an unknown city slug', async () => {
    await request(app.getHttpServer()).get('/leaderboard?city=not-a-real-city-slug').expect(404);
  });
});
