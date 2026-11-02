import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('rate limiting', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(passport.initialize());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('the sixth login attempt within a minute returns 429', async () => {
    const credentials = { email: 'rate-limit-test@example.com', password: 'wrong-password' };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app.getHttpServer()).post('/auth/login').send(credentials);
      expect(response.status).toBe(401);
    }

    const sixthAttempt = await request(app.getHttpServer()).post('/auth/login').send(credentials);
    expect(sixthAttempt.status).toBe(429);
  });
});
