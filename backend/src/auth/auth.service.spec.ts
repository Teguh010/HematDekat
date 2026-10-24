import { describe, expect, it } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  it('hashes and verifies a password', async () => {
    const service = new AuthService();
    const hash = await service.hashPassword('secret-password');

    await expect(service.verifyPassword('secret-password', hash)).resolves.toBe(true);
    await expect(service.verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('builds a JWT cookie payload and options', () => {
    const service = new AuthService();
    const cookie = service.buildJwtCookie('user-123');

    expect(cookie.name).toBe('access_token');
    expect(cookie.value).toBe('user-123');
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.sameSite).toBe('lax');
    expect(cookie.options.secure).toBe(false);
  });

  it('persists the seed admin into Prisma-backed storage', async () => {
    const users = new Map<string, { id: string; email: string; name: string | null; role: 'USER' | 'ADMIN'; passwordHash: string | null; googleId: string | null }>();

    const prisma = {
      user: {
        upsert: async ({ where, create, update }) => {
          const record = {
            id: users.get(where.email)?.id ?? 'user-1',
            email: where.email,
            name: create.name ?? update.name ?? null,
            role: create.role ?? update.role ?? 'USER',
            passwordHash: create.passwordHash ?? update.passwordHash ?? null,
            googleId: create.googleId ?? update.googleId ?? null,
          };

          users.set(where.email, record);
          return record;
        },
        findUnique: async ({ where }) => users.get(where.email) ?? null,
      },
    } as unknown as PrismaService;

    const service = new AuthService(undefined, prisma);
    const user = await service.validateLocalUser('admin@example.com', 'admin123');

    expect(user.email).toBe('admin@example.com');
    expect(user.role).toBe('ADMIN');
    expect(user.name).toBe('Admin');
  });
});
