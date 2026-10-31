import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { assertJwtSecret } from './auth/jwt-secret.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  assertJwtSecret(process.env.JWT_SECRET);

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(passport.initialize());
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}

await bootstrap();
