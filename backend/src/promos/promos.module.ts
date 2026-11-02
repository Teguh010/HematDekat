import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { PromosController } from './promos.controller.js';
import { PromosService } from './promos.service.js';

@Module({
  imports: [PrismaModule, StoresModule],
  controllers: [PromosController],
  providers: [PromosService],
})
export class PromosModule {}
