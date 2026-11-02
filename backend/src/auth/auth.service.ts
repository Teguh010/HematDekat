import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';

export type AppRole = 'USER' | 'ADMIN';

export type PublicRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
}

export interface CurrentUserDto {
  id: string;
  email: string;
  name: string | null;
  role: PublicRole;
}

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async register(input: { email: string; password: string; name: string }): Promise<CurrentUserDto> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const password = input.password;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(password);
    const createdUser = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'USER',
      },
    });

    return this.toCurrentUser({
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
    });
  }

  async validateLocalUser(email: string, password: string): Promise<AuthUser> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.verifyPassword(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async validateGoogleUser(profile: {
    id: string;
    emails?: Array<{ value?: string }>;
    displayName?: string;
  }): Promise<AuthUser> {
    const email = profile.emails?.[0]?.value ?? `${profile.id}@google.local`;
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        name: profile.displayName ?? null,
        role: 'USER',
        googleId: profile.id,
      },
      update: {
        name: profile.displayName ?? null,
        googleId: profile.id,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  async getCurrentUser(userId: string): Promise<CurrentUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toCurrentUser(user);
  }

  toCurrentUser(user: Pick<AuthUser, 'id' | 'email' | 'name' | 'role'>): CurrentUserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === 'ADMIN' ? 'admin' : 'user',
    };
  }

  issueToken(user: Pick<AuthUser, 'id' | 'email' | 'role'>): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  getUserFromJwtPayload(payload: { sub: string; email: string; role: AppRole }): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      name: null,
      role: payload.role,
    };
  }

  buildJwtCookie(token: string) {
    return {
      name: 'access_token',
      value: token,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: COOKIE_MAX_AGE_MS,
      },
    };
  }
}
