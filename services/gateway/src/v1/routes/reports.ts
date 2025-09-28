import { getAuth } from '@clerk/express';
import type { Express } from 'express';
import {
	defaultEndpointsFactory,
	EndpointsFactory,
	ResultHandler,
} from 'express-zod-api';
import { z } from 'zod';

import { AnalyticsServiceClient } from '../../clients';
import { supabase } from '../../db';
import * as AnalyticsService from '../../generated/analytics_service';
import { ReadingTimespan } from '../../generated/reading';
import { SymptomReport } from '../../generated/symptom_report';

export const FetchReportsEndpointRequestSchema = z.object({});

export const FetchReportsEndpointResponseSchema = z.object({
	reports: z.array(z.custom<SymptomReport>()),
});

export const FetchReportsEndpoint = defaultEndpointsFactory.build({
	input: FetchReportsEndpointRequestSchema,
	output: FetchReportsEndpointResponseSchema,
	method: 'get',
	handler: async ({
		input,
		options,
		logger,
		request: req,
		response: res,
	}) => {
		const auth = getAuth(req);
		console.log('Auth object:', auth);
		console.log('Headers:', req.headers);

		// Handle pending sessions - they're valid but not fully activated
		if (
			!auth.userId ||
			(auth.sessionStatus !== 'active' &&
				auth.sessionStatus !== 'pending')
		) {
			console.log(
				'Unauthorized request to /api/reports. Auth status:',
				auth,
			);
			return void res.status(401).json({ message: 'Unauthorized' });
		}

		const { data, error } = await supabase
			.from('reports')
			.select('*')
			.eq('user_id', auth.userId);

		if (error) {
			console.log('Error fetching reports from database:', error);
			return res.status(500).json({ message: 'Failed to fetch reports' });
		}

		return res.json({ reports: data });
	},
});

export const LogReportEndpointRequestSchema = z.object({
	text: z.string().min(1),
});

export const LogReportEndpointResponseSchema =
	z.custom<AnalyticsService.InferSymptomsAndCauseResponse>();

export const LogReportEndpoint = defaultEndpointsFactory.build({
	input: LogReportEndpointRequestSchema,
	output: LogReportEndpointResponseSchema,
	method: 'post',
	handler: async ({ input, options, logger, request, response }) => {
		console.log('Received /api/reports request with body:', request.body);
		const auth = getAuth(request);

		// Handle pending sessions - they're valid but not fully activated
		if (
			!auth.userId ||
			(auth.sessionStatus !== 'active' &&
				auth.sessionStatus !== 'pending')
		) {
			console.log(
				'Unauthorized request to /api/reports. Auth status:',
				auth,
			);
			return response.status(401).json({ message: 'Unauthorized' });
		}

		console.log(request.body);
		const reportRes = await AnalyticsServiceClient.InferSymptomsAndCause(
			AnalyticsService.InferSymptomsAndCauseRequest.create({
				text: request.body.text,
			}),
		);

		console.log('InferSymptomsAndCause response:', reportRes);

		if (!reportRes.success) {
			return response
				.status(400)
				.json({ message: 'Failed to analyze symptoms' });
		}

		const { data, error } = await supabase.from('reports').insert({
			user_id: auth.userId,
			timestamp: new Date(),
			symptoms: reportRes.symptoms,
			cause: reportRes.cause,
			notes: null,
			lat: request.body.location?.lat,
			lon: request.body.location?.lon,
		});

		if (error) {
			console.log('Error inserting report into database:', error);
			return response
				.status(500)
				.json({ message: 'Failed to save report' });
		}

		console.log('Inserted report into database:', data);

		return response.json(reportRes);
	},
});
