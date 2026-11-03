import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { SavedStoresController } from './saved-stores.controller.js';
import { SavedStoresService } from './saved-stores.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [SavedStoresController],
  providers: [SavedStoresService],
  exports: [SavedStoresService],
})
export class SavedStoresModule {}
