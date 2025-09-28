import { getAuth } from '@clerk/express';
import type { Express } from 'express';
import { defaultEndpointsFactory } from 'express-zod-api';
import { z } from 'zod';

import { AnalyticsServiceClient } from '../../clients';
import * as AnalyticsService from '../../generated/analytics_service';

export const TriggerReadingsAnalysisJobEndpointRequestSchema = z.object({
	timespan: z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH']),
	similarity: z.union([z.string(), z.array(z.string()).optional()]),
});

export const TriggerReadingsAnalysisJobEndpointResponseSchema =
	z.custom<AnalyticsService.CalculateReadingResponse>();

export const TriggerReadingsAnalysisJobEndpoint = defaultEndpointsFactory.build(
	{
		input: TriggerReadingsAnalysisJobEndpointRequestSchema,
		output: TriggerReadingsAnalysisJobEndpointResponseSchema,
		method: 'post',
		handler: async ({
			input,
			options,
			logger,
			request: req,
			response: res,
		}) => {
			const allowedRoles = ['system', 'admin', 'developer'];
			const auth = getAuth(req);
			if (!auth.isAuthenticated) {
				return res.status(401).send({ message: 'Unauthorized' });
			}
			if (
				!auth.sessionClaims.metadata.role ||
				!allowedRoles.includes(auth.sessionClaims.metadata.role)
			) {
				return res.status(403).send({ message: 'Forbidden' });
			}

			console.log(
				'Received /api/internal/readings request with body:',
				req.body,
			);

			// Validate request body.
			try {
				const readingRes =
					await AnalyticsServiceClient.CalculateReading(
						AnalyticsService.CalculateReadingRequest.create(
							req.body,
						),
					);

				if (readingRes.error) {
					console.error(
						'Error from CalculateReading:',
						readingRes.error,
					);
					return res
						.status(400)
						.send({ message: readingRes.error || 'Bad Request' });
				}

				console.log('CalculateReading response:', readingRes);

				res.status(200).send({ reading: readingRes.reading });
			} catch (error) {
				console.error(
					'Error processing /api/internal/readings request:',
					error,
				);
				return res.status(400).send({ message: 'Bad Request' });
			}

			return;
		},
	},
);
