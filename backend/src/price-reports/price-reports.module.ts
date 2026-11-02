import { Module } from '@nestjs/common';
import { PlacesModule } from '../places/places.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { PriceReportsController } from './price-reports.controller.js';
import { PriceReportsService } from './price-reports.service.js';

@Module({
  imports: [PrismaModule, PlacesModule, StoresModule],
  controllers: [PriceReportsController],
  providers: [PriceReportsService],
})
export class PriceReportsModule {}
