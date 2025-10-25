import { type User } from '@clerk/backend';
import { BadRequestException, Controller, Get, Inject } from '@nestjs/common';
import { CurrentUser } from 'src/decorators/current-user.decorator';

import {
  FetchLatestDataRequest,
  MLServiceClientImpl,
} from 'src/generated/ml_service';
import { SupabaseClient } from '@supabase/supabase-js';
import { GetHeatmapResponse } from 'src/generated/portal_service';
import { Public } from 'src/decorators/public.decorator';

@Controller({ path: '/map', version: '1' })
export class MapController {
  constructor(
    @Inject('ML_SERVICE_CLIENT')
    private readonly mlServiceClient: MLServiceClientImpl,
  ) {}

  @Public()
  @Get()
  async getHeatmap(): Promise<GetHeatmapResponse> {
    try {
      const fetchRes = await this.mlServiceClient.FetchLatestData(
        FetchLatestDataRequest.create({}),
      );

      console.log('FetchLatestData response:', fetchRes);
      return fetchRes;
    } catch (error) {
      console.error('Error processing /v1/map request:', error);
      throw new BadRequestException();
    }
  }
}
