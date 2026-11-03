import { Module } from '@nestjs/common';

import { PointsModule } from '../points/points.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { VotesController } from './votes.controller.js';
import { VotesService } from './votes.service.js';

@Module({
  imports: [PrismaModule, PointsModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
