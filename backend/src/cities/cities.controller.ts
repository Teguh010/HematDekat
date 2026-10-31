import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CitiesService } from './cities.service.js';

@Controller('cities')
export class CitiesController {
  constructor(private readonly cities: CitiesService) {}

  @Get()
  list() {
    return this.cities.list();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const city = await this.cities.findBySlug(slug);

    if (!city) {
      throw new NotFoundException(`City with slug "${slug}" not found`);
    }

    return city;
  }
}
