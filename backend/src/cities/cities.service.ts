import { Injectable } from '@nestjs/common';

import { type CityDto, publicStoreWhere, toCityDto } from '../common/dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CityDto[]> {
    const cities = await this.prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { stores: { where: publicStoreWhere(new Date()) } } } },
    });

    return cities.map(toCityDto);
  }

  async findBySlug(slug: string): Promise<CityDto | null> {
    const city = await this.prisma.city.findUnique({
      where: { slug },
      include: { _count: { select: { stores: { where: publicStoreWhere(new Date()) } } } },
    });

    return city ? toCityDto(city) : null;
  }
}
