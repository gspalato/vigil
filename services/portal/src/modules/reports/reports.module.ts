import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { SupabaseModule } from '../db/supabase.module';
import { GRPCModule } from '../grpc/clients';

@Module({
  controllers: [ReportsController],
  providers: [],
  imports: [SupabaseModule, GRPCModule],
})
export class ReportsModule {}
