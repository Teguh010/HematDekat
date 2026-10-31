import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CitiesController } from './cities.controller.js';
import { CitiesService } from './cities.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CitiesController],
  providers: [CitiesService],
  exports: [CitiesService],
})
export class CitiesModule {}
