import { Controller, Delete, Get, HttpCode, Param, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthUser } from '../auth/auth.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SavedStoresService } from './saved-stores.service.js';

@Controller('me/saved-stores')
@UseGuards(JwtAuthGuard)
export class SavedStoresController {
  constructor(private readonly savedStores: SavedStoresService) {}

  @Get()
  list(@Req() req: Request & { user?: AuthUser }) {
    return this.savedStores.list(requireUser(req).id);
  }

  @Put(':storeSlug')
  @HttpCode(204)
  async save(@Param('storeSlug') storeSlug: string, @Req() req: Request & { user?: AuthUser }): Promise<void> {
    await this.savedStores.save(requireUser(req).id, storeSlug);
  }

  @Delete(':storeSlug')
  @HttpCode(204)
  async unsave(@Param('storeSlug') storeSlug: string, @Req() req: Request & { user?: AuthUser }): Promise<void> {
    await this.savedStores.unsave(requireUser(req).id, storeSlug);
  }
}

function requireUser(req: Request & { user?: AuthUser }): AuthUser {
  if (!req.user) {
    throw new Error('Authenticated user is required');
  }

  return req.user;
}
