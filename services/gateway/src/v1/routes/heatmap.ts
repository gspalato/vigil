import { getAuth } from '@clerk/express';
import type { Express } from 'express';
import { defaultEndpointsFactory, ResultHandler } from 'express-zod-api';
import { z } from 'zod';

import { AnalyticsServiceClient } from '../../clients';
import * as AnalyticsService from '../../generated/analytics_service';
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

		// Validate query parameters.
		if (
			typeof req.query.timespan !== 'string' &&
			req.query.timespan !== undefined
		) {
			return res.status(400).send({ message: 'Invalid timespan' });
		}

		// Fetch heatmap based on query.
		let timespan: ReadingTimespan;
		switch (req.query.timespan?.toLowerCase()) {
			case 'hour':
				timespan = ReadingTimespan.HOUR;
				break;
			case 'day':
				timespan = ReadingTimespan.DAY;
				break;
			case 'week':
				timespan = ReadingTimespan.WEEK;
				break;
			case 'month':
				timespan = ReadingTimespan.MONTH;
				break;
			default:
				return res.status(400).send({ message: 'Invalid timespan' });
		}

		let similarity: string[] = [];
		if (req.query.similarity) {
			// Check if similarity is a string.
			if (typeof req.query.similarity === 'string') {
				similarity.push(req.query.similarity);
			} else if (Array.isArray(req.query.similarity)) {
				similarity = req.query.similarity as string[];
			}
		}

		const fetchRes = await AnalyticsServiceClient.FetchHeatmap(
			AnalyticsService.FetchHeatmapRequest.create({
				timespan: timespan,
				similarity: similarity,
			}),
		);

		res.send(fetchRes);

		return;
	},
});
