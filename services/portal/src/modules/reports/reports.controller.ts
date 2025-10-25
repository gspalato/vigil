import { type User } from '@clerk/backend';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Post,
} from '@nestjs/common';
import { CurrentUser } from 'src/decorators/current-user.decorator';

import {
  GenerateSymptomReportRequest,
  MLServiceClientImpl,
} from 'src/generated/ml_service';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  GetAllUserReportsRequest,
  GetAllUserReportsResponse,
  RegisterUserReportResponse,
} from 'src/generated/portal_service';
import { ApiBody } from '@nestjs/swagger';

type RegisterUserReportBody = {
  text: string;
  location: {
    lat: number;
    lon: number;
  };
};

@Controller({ path: '/reports', version: '1' })
export class ReportsController {
  constructor(
    @Inject('SUPABASE_CLIENT') private readonly supabaseClient: SupabaseClient,
    @Inject('ML_SERVICE_CLIENT')
    private readonly mlServiceClient: MLServiceClientImpl,
  ) {}

  @Get()
  async getAllUserReports(
    @CurrentUser() user: User,
  ): Promise<GetAllUserReportsResponse> {
    const { data, error } = await this.supabaseClient
      .from('reports')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.log('Error fetching reports from database:', error);

      throw new InternalServerErrorException('Failed to fetch reports.');
    }

    return { reports: data };
  }

  @Post()
  async registerUserReport(
    @CurrentUser() user: User,
    @Body() body: RegisterUserReportBody,
  ): Promise<RegisterUserReportResponse> {
    const reportRes = await this.mlServiceClient.GenerateSymptomReport(
      GenerateSymptomReportRequest.create({
        text: body.text,
        lat: body.location.lat,
        lon: body.location.lon,
      }),
    );

    console.log('GenerateSymptomReport response:', reportRes);

    if (!reportRes.success || !reportRes.report)
      throw new BadRequestException('Failed to analyze symptoms');

    const hydratedSymptomReport = {
      user_id: user.id,
      timestamp: new Date(),
      symptoms: reportRes.report.symptoms,
      cause: reportRes.report.cause,
      notes: null,
      lat: body.location?.lat,
      lon: body.location?.lon,
    };

    const { data, error } = await this.supabaseClient
      .from('reports')
      .insert(hydratedSymptomReport);

    if (error) {
      console.log('Error inserting report into database:', error);
      throw new InternalServerErrorException('Failed to save report');
    }

    return {
      report: hydratedSymptomReport as any,
    };
  }
}
