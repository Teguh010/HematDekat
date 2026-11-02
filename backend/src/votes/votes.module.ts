import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { VotesController } from './votes.controller.js';
import { VotesService } from './votes.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
