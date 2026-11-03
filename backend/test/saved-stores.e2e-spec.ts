import { randomUUID } from 'node:crypto';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'argon2';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import request from 'supertest';
import { App } from 'supertest/types';

import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from './../src/app.module.js';

describe('/me/saved-stores', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;
  let storeSlug: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(passport.initialize());
    prisma = app.get(PrismaService);
    await app.init();

    const store = await prisma.store.findFirst();
    if (!store) {
      throw new Error('No store found in the seeded database');
    }
    storeSlug = store.slug;

    const suffix = randomUUID().slice(0, 8);
    const email = `saved-stores-${suffix}@example.com`;
    const password = 'password123';

    await prisma.user.create({
      data: { email, name: 'Saved Stores Test', passwordHash: await hash(password), role: 'USER' },
    });

    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);
    cookie = login.headers['set-cookie'][0].split(';')[0];
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('requires auth', async () => {
    await request(app.getHttpServer()).get('/me/saved-stores').expect(401);
    await request(app.getHttpServer()).put(`/me/saved-stores/${storeSlug}`).expect(401);
    await request(app.getHttpServer()).delete(`/me/saved-stores/${storeSlug}`).expect(401);
  });

  it('returns 404 for an unknown store slug', async () => {
    await request(app.getHttpServer())
      .put('/me/saved-stores/not-a-real-store-slug')
      .set('Cookie', cookie)
      .expect(404);
  });

  it('saves, lists, reloads (still saved), then unsaves', async () => {
    await request(app.getHttpServer()).put(`/me/saved-stores/${storeSlug}`).set('Cookie', cookie).expect(204);

    const afterSave = await request(app.getHttpServer())
      .get('/me/saved-stores')
      .set('Cookie', cookie)
      .expect(200);
    expect(afterSave.body.some((item: { slug: string }) => item.slug === storeSlug)).toBe(true);

    // Saving again (e.g. a reloaded page re-sending the same request) must not error.
    await request(app.getHttpServer()).put(`/me/saved-stores/${storeSlug}`).set('Cookie', cookie).expect(204);

    const stillSaved = await request(app.getHttpServer())
      .get('/me/saved-stores')
      .set('Cookie', cookie)
      .expect(200);
    expect(stillSaved.body.filter((item: { slug: string }) => item.slug === storeSlug).length).toBe(1);

    await request(app.getHttpServer()).delete(`/me/saved-stores/${storeSlug}`).set('Cookie', cookie).expect(204);

    const afterUnsave = await request(app.getHttpServer())
      .get('/me/saved-stores')
      .set('Cookie', cookie)
      .expect(200);
    expect(afterUnsave.body.some((item: { slug: string }) => item.slug === storeSlug)).toBe(false);

    // Unsaving again must not error.
    await request(app.getHttpServer()).delete(`/me/saved-stores/${storeSlug}`).set('Cookie', cookie).expect(204);
  });
});
