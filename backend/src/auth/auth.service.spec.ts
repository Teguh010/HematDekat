import { UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import type { PointsService } from '../points/points.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { assertJwtSecret } from './jwt-secret.js';

type StoredUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  passwordHash: string | null;
  googleId: string | null;
};

function createService(users: Map<string, StoredUser>, pointsByUser: Map<string, number> = new Map()) {
  const prisma = {
    user: {
      findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
        if (where.email) {
          return users.get(where.email) ?? null;
        }

        return [...users.values()].find((user) => user.id === where.id) ?? null;
      },
      create: async ({ data }: { data: Partial<StoredUser> & { email: string; role?: 'USER' | 'ADMIN'; name?: string | null; passwordHash?: string | null; googleId?: string | null } }) => {
        const user: StoredUser = {
          id: data.id ?? `user-${users.size + 1}`,
          email: data.email,
          name: data.name ?? null,
          role: data.role ?? 'USER',
          passwordHash: data.passwordHash ?? null,
          googleId: data.googleId ?? null,
        };

        users.set(data.email, user);
        return user;
      },
    },
  } as unknown as PrismaService;

  const jwtService = {
    sign: () => 'signed-token',
  } as unknown as JwtService;

  const points = {
    getTotalPoints: async (userId: string) => pointsByUser.get(userId) ?? 0,
  } as unknown as PointsService;

  return new AuthService(jwtService, prisma, points);
}

describe('assertJwtSecret', () => {
  it('rejects a missing or short secret', () => {
    expect(() => assertJwtSecret(undefined)).toThrow(/at least 32 characters/);
    expect(() => assertJwtSecret('too-short')).toThrow(/at least 32 characters/);
  });

  it('accepts a secret of 32 characters', () => {
    const secret = 'a'.repeat(32);
    expect(assertJwtSecret(secret)).toBe(secret);
  });
});

describe('AuthService', () => {
  it('hashes and verifies a password', async () => {
    const service = createService(new Map());
    const hash = await service.hashPassword('secret-password');

    await expect(service.verifyPassword('secret-password', hash)).resolves.toBe(true);
    await expect(service.verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('builds a JWT cookie that lasts 7 days', () => {
    const service = createService(new Map());
    const cookie = service.buildJwtCookie('user-123');

    expect(cookie.name).toBe('access_token');
    expect(cookie.value).toBe('user-123');
    expect(cookie.options.httpOnly).toBe(true);
    expect(cookie.options.sameSite).toBe('lax');
    expect(cookie.options.secure).toBe(false);
    expect(cookie.options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('signs in an existing user without creating an admin', async () => {
    const hash = await createService(new Map()).hashPassword('admin123');
    const users = new Map<string, StoredUser>([
      [
        'admin@example.com',
        {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin Sembako',
          role: 'ADMIN',
          passwordHash: hash,
          googleId: null,
        },
      ],
    ]);

    const service = createService(users);
    const user = await service.validateLocalUser('admin@example.com', 'admin123');

    expect(user.email).toBe('admin@example.com');
    expect(user.role).toBe('ADMIN');
    expect(users.size).toBe(1);
  });

  it('rejects an unknown email', async () => {
    const service = createService(new Map());

    await expect(service.validateLocalUser('missing@example.com', 'admin123')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('loads the current user from the database with a lowercase role and their total points', async () => {
    const users = new Map<string, StoredUser>([
      [
        'rina@example.com',
        {
          id: 'user-2',
          email: 'rina@example.com',
          name: 'Rina',
          role: 'USER',
          passwordHash: null,
          googleId: null,
        },
      ],
    ]);

    const currentUser = await createService(users, new Map([['user-2', 42]])).getCurrentUser('user-2');

    expect(currentUser).toEqual({
      id: 'user-2',
      email: 'rina@example.com',
      name: 'Rina',
      role: 'user',
      points: 42,
    });
  });

  it('registers a new local user with a hashed password', async () => {
    const users = new Map<string, StoredUser>();
    const service = createService(users);
    const user = await service.register({
      email: 'sari@example.com',
      password: 'sembako123',
      name: 'Sari',
    });

    const storedUser = users.get('sari@example.com');

    expect(user).toEqual({
      id: 'user-1',
      email: 'sari@example.com',
      name: 'Sari',
      role: 'user',
      points: 0,
    });
    expect(storedUser?.passwordHash).toBeTruthy();
    expect(storedUser?.passwordHash).not.toBe('sembako123');
  });

  it('rejects duplicate registration emails', async () => {
    const users = new Map<string, StoredUser>([
      [
        'sari@example.com',
        {
          id: 'user-7',
          email: 'sari@example.com',
          name: 'Sari',
          role: 'USER',
          passwordHash: 'existing-hash',
          googleId: null,
        },
      ],
    ]);

    await expect(
      createService(users).register({
        email: 'sari@example.com',
        password: 'sembako123',
        name: 'Sari Baru',
      }),
    ).rejects.toMatchObject({
      response: { statusCode: 409 },
    });
  });
});
