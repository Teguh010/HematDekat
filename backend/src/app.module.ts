import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CitiesModule } from './cities/cities.module.js';
import { LeaderboardModule } from './leaderboard/leaderboard.module.js';
import { PlacesModule } from './places/places.module.js';
import { PriceReportsModule } from './price-reports/price-reports.module.js';
import { ProductsModule } from './products/products.module.js';
import { PromosModule } from './promos/promos.module.js';
import { SavedStoresModule } from './saved-stores/saved-stores.module.js';
import { StoresModule } from './stores/stores.module.js';
import { VotesModule } from './votes/votes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Baseline "default" throttler bucket; every @Throttle({ default: {...} })
    // decorator overrides these numbers for its own route. Not registered as
    // a global guard, so routes without @UseGuards(ThrottlerGuard) are unaffected.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 1000 }]),
    AuthModule,
    AdminModule,
    CitiesModule,
    ProductsModule,
    StoresModule,
    PlacesModule,
    PriceReportsModule,
    PromosModule,
    VotesModule,
    LeaderboardModule,
    SavedStoresModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
