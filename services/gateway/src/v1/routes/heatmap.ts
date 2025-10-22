import { getAuth } from '@clerk/express';
import type { Express } from 'express';
import { defaultEndpointsFactory, ResultHandler } from 'express-zod-api';
import { z } from 'zod';

import { AnalyticsServiceClient, MLServiceClient } from '../../clients';
import * as AnalyticsService from '../../generated/analytics_service';
import * as MLService from '../../generated/ml_service';
import { ReadingTimespan } from '../../generated/reading';

export const FetchHeatmapEndpointRequestSchema = z.object({
	timespan: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
	similarity: z.union([z.string(), z.array(z.string()).optional()]),
});

export const FetchHeatmapEndpointResponseSchema =
	z.custom<AnalyticsService.FetchHeatmapResponse>();

export const FetchHeatmapEndpoint = defaultEndpointsFactory.build({
	input: FetchHeatmapEndpointRequestSchema,
	output: FetchHeatmapEndpointResponseSchema,
	method: 'get',
	handler: async ({
		input,
		options,
		logger,
		request: req,
		response: res,
	}) => {
		//const { userId } = getAuth(req)
		//if (!userId) {
		//  return res.status(401).send({ 'message': 'Unauthorized' });
		//}

		console.log('Received /api/heatmap request with query:', req.query);

		const fetchRes = await MLServiceClient.FetchLatestData(
			MLService.FetchLatestDataRequest.create({})
		);

		res.send(fetchRes);

		return;
	},
});
