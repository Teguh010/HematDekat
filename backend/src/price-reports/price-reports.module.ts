import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StoresModule } from '../stores/stores.module.js';
import { PriceReportsController } from './price-reports.controller.js';
import { PriceReportsService } from './price-reports.service.js';

@Module({
  imports: [PrismaModule, StoresModule],
  controllers: [PriceReportsController],
  providers: [PriceReportsService],
})
export class PriceReportsModule {}
