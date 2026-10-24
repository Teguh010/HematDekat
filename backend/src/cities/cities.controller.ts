import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('cities')
export class CitiesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll() {
    return this.prisma.city.findMany({
      orderBy: { name: 'asc' },
    });
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug },
      include: {
        stores: {
          orderBy: { name: 'asc' },
          take: 20,
        },
      },
    });

    if (!city) {
      throw new NotFoundException(`City with slug "${slug}" not found`);
    }

    return city;
  }
}
