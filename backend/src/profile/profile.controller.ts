import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthUser } from '../auth/auth.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ProfileService } from './profile.service.js';

@Controller('me/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  getProfile(@Req() req: Request & { user?: AuthUser }) {
    return this.profile.getProfile(requireUser(req).id);
  }
}

function requireUser(req: Request & { user?: AuthUser }): AuthUser {
  if (!req.user) {
    throw new Error('Authenticated user is required');
  }

  return req.user;
}
