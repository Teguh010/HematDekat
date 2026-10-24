import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';

export type AppRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  passwordHash?: string | null;
  googleId?: string | null;
}

@Injectable()
export class AuthService {
  private readonly users = new Map<string, AuthUser>();
  private readonly loginAttempts = new Map<string, number[]>();

  constructor(private readonly jwtService: JwtService) {
    void this.ensureSeedAdmin();
  }

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async ensureSeedAdmin(): Promise<void> {
    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@sembakomurah.test').toLowerCase();

    if (this.users.has(adminEmail)) {
      return;
    }

    const passwordHash = await this.hashPassword('admin123');
    this.users.set(adminEmail, {
      id: randomUUID(),
      email: adminEmail,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash,
    });
  }

  async validateLocalUser(email: string, password: string): Promise<AuthUser> {
    await this.ensureSeedAdmin();
    await this.enforceRateLimit(email);

    const normalizedEmail = email.toLowerCase();
    const user = this.users.get(normalizedEmail);

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
      googleId: user.googleId ?? null,
    };
  }

  async validateGoogleUser(profile: {
    id: string;
    emails?: Array<{ value?: string }>; 
    displayName?: string;
  }): Promise<AuthUser> {
    const email = profile.emails?.[0]?.value ?? `${profile.id}@google.local`;
    const normalizedEmail = email.toLowerCase();
    const existing = this.users.get(normalizedEmail);

    if (existing) {
      return {
        id: existing.id,
        email: existing.email,
        name: existing.name ?? profile.displayName ?? null,
        role: existing.role,
        googleId: existing.googleId ?? profile.id,
      };
    }

    const createdUser: AuthUser = {
      id: randomUUID(),
      email: normalizedEmail,
      name: profile.displayName ?? null,
      role: 'USER',
      googleId: profile.id,
    };

    this.users.set(normalizedEmail, createdUser);
    return createdUser;
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
        maxAge: 60 * 60 * 1000,
      },
    };
  }

  private async enforceRateLimit(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase();
    const attempts = this.loginAttempts.get(normalizedEmail) ?? [];
    const windowStart = Date.now() - 60_000;
    const recentAttempts = attempts.filter((timestamp) => timestamp > windowStart);

    if (recentAttempts.length >= 5) {
      throw new HttpException(
        'Too many login attempts. Please wait a minute and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recentAttempts.push(Date.now());
    this.loginAttempts.set(normalizedEmail, recentAttempts);
  }
}
