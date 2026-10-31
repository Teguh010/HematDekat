import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { hash } from 'argon2';
import passport from 'passport';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from './../src/app.module.js';

describe('backend e2e baseline', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(passport.initialize());
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /cities returns the list shape', async () => {
    const response = await request(app.getHttpServer()).get('/cities').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
      province: expect.any(String),
      centerLat: expect.any(Number),
      centerLng: expect.any(Number),
      storeCount: expect.any(Number),
    });
  });

  it('GET /stores/:slug never exposes pending reports', async () => {
    const store = await prisma.store.findFirst({
      include: { city: true },
    });

    if (!store) {
      throw new Error('No store found in the seeded database');
    }

    const product = await prisma.product.findFirst();

    if (!product) {
      throw new Error('No product found in the seeded database');
    }

    const approvedCountBefore = await prisma.priceReport.count({
      where: { storeId: store.id, status: 'APPROVED' },
    });

    await prisma.priceReport.create({
      data: {
        storeId: store.id,
        productId: product.id,
        price: 12345,
        quantity: 1,
        unit: product.defaultUnit,
        normalizedUnitPrice: 12345,
        status: 'PENDING',
      },
    });

    const response = await request(app.getHttpServer()).get(`/stores/${store.slug}`).expect(200);

    expect(response.body.prices.length).toBe(approvedCountBefore);
    expect(response.body.prices.every((item: { productSlug: string }) => item.productSlug)).toBe(true);
  });

  it('admin endpoints require auth and admin role', async () => {
    const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD ?? 'admin123';

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const adminCookie = adminLogin.headers['set-cookie'][0].split(';')[0];

    await request(app.getHttpServer()).get('/admin/pending').set('Cookie', adminCookie).expect(200);
    await request(app.getHttpServer()).get('/admin/pending').expect(401);

    const regularEmail = 'regular-user@example.com';
    const regularPassword = 'password123';

    await prisma.user.upsert({
      where: { email: regularEmail },
      update: {},
      create: {
        email: regularEmail,
        name: 'Regular User',
        passwordHash: await hash(regularPassword),
        role: 'USER',
      },
    });

    const regularLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: regularEmail, password: regularPassword })
      .expect(200);

    const regularCookie = regularLogin.headers['set-cookie'][0].split(';')[0];

    await request(app.getHttpServer()).get('/admin/pending').set('Cookie', regularCookie).expect(403);
  });
});
