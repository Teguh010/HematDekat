import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CitiesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.city.findMany({
      orderBy: { name: 'asc' },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.city.findUnique({
      where: { slug },
      include: {
        stores: {
          orderBy: { name: 'asc' },
          take: 20,
        },
      },
    });
  }
}
