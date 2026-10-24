import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type AppRole, AuthService } from './auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          const cookieValue = request?.cookies?.access_token;
          if (cookieValue) {
            return cookieValue;
          }

          const header = request?.headers?.authorization;
          if (typeof header === 'string' && header.startsWith('Bearer ')) {
            return header.replace('Bearer ', '');
          }

          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
    });
  }

  async validate(payload: { sub: string; email: string; role: AppRole }) {
    return this.authService.getUserFromJwtPayload(payload);
  }
}
