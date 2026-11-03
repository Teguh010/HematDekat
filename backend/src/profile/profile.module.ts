import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SavedStoresModule } from '../saved-stores/saved-stores.module.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

@Module({
  imports: [PrismaModule, AuthModule, SavedStoresModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
