import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkClientProvider } from './modules/auth/clerk-client.provider';
import { AuthModule } from './modules/auth/auth.module';
import { SupabaseModule } from './modules/db/supabase.module';
import { ReportsModule } from './modules/reports/reports.module';
import { APP_GUARD } from '@nestjs/core';
import { ClerkAuthGuard } from './modules/auth/clerk.guard';
import { MapModule } from './modules/map/map.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    AuthModule,
    SupabaseModule,

    ReportsModule,
    MapModule,
  ],
  controllers: [],
  providers: [
    ClerkClientProvider,
    {
      provide: APP_GUARD,
      useClass: ClerkAuthGuard,
    },
  ],
})
export class AppModule {}
