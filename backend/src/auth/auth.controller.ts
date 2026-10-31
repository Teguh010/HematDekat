import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LocalAuthGuard } from './local-auth.guard.js';
import { AuthService, type AuthUser } from './auth.service.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: z.infer<typeof loginSchema>,
    @Req() req: Request & { user?: AuthUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.authService.issueToken(user);
    const cookie = this.authService.buildJwtCookie(token);

    res.cookie(cookie.name, cookie.value, cookie.options);

    return this.authService.toCurrentUser(user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    const hasConfiguredGoogleOAuth = Boolean(
      process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
    );

    if (!hasConfiguredGoogleOAuth) {
      throw new UnauthorizedException('Google OAuth is not configured yet');
    }

    return { message: 'Redirecting to Google OAuth...' };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user?: AuthUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const token = this.authService.issueToken(user);
    const cookie = this.authService.buildJwtCookie(token);
    res.cookie(cookie.name, cookie.value, cookie.options);

    const frontendBaseUrl = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '');
    return res.redirect(`${frontendBaseUrl}/login?auth=google-success`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: Request & { user?: AuthUser }) {
    if (!req.user) {
      throw new UnauthorizedException('Not signed in');
    }

    return this.authService.getCurrentUser(req.user.id);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const cookie = this.authService.buildJwtCookie('');
    res.clearCookie(cookie.name, cookie.options);
    return { ok: true };
  }
}
