import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from './auth.service.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || 'development-google-client-id';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || 'development-google-client-secret';

    super({
      clientID: googleClientId,
      clientSecret: googleClientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ) {
    const hasConfiguredGoogleOAuth = Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
    );

    if (!hasConfiguredGoogleOAuth) {
      done(new Error('Google OAuth is not configured yet'));
      return;
    }

    const user = await this.authService.validateGoogleUser({
      id: profile.id,
      emails: profile.emails ?? [],
      displayName: profile.displayName,
    });

    done(null, user);
  }
}
