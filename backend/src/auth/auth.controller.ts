import {
  Body,
  Controller,
  Get,
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

    return {
      message: 'Signed in successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
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

    return {
      message: 'Google sign-in successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: Request & { user?: AuthUser }) {
    return req.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/', httpOnly: true, sameSite: 'lax' });
    return { message: 'Signed out' };
  }
}
