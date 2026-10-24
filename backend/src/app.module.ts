import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin/admin.controller.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CitiesController } from './cities/cities.controller.js';
import { PlacesController } from './places/places.controller.js';
import { PrismaService } from './prisma/prisma.service.js';
import { ProductsController } from './products/products.controller.js';
import { StoresController } from './stores/stores.controller.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
  controllers: [AppController, AdminController, CitiesController, ProductsController, StoresController, PlacesController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
