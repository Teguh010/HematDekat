import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AdminService } from './admin.service.js';

const moderationStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('pending')
  async getPending() {
    return { items: await this.admin.listPending() };
  }

  @Patch('price-reports/:id/status')
  updatePriceReportStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderationStatusSchema)) body: z.infer<typeof moderationStatusSchema>,
  ) {
    return this.admin.setPriceReportStatus(id, body.status);
  }

  @Patch('promos/:id/status')
  updatePromoStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moderationStatusSchema)) body: z.infer<typeof moderationStatusSchema>,
  ) {
    return this.admin.setPromoStatus(id, body.status);
  }
}
