import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { GRPCModule } from '../grpc/clients';

@Module({
  controllers: [MapController],
  providers: [],
  imports: [GRPCModule],
})
export class MapModule {}
