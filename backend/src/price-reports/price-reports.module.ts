import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PlacesModule } from '../places/places.module.js';
import { PriceReportsController } from './price-reports.controller.js';
import { PriceReportsService } from './price-reports.service.js';

@Module({
  imports: [PrismaModule, PlacesModule],
  controllers: [PriceReportsController],
  providers: [PriceReportsService],
})
export class PriceReportsModule {}
