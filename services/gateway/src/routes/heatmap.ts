import type { Express } from 'express';

import { AnalyticsServiceClient, MLServiceClient } from '../clients';

import * as AnalyticsService from '../generated/analytics_service';
import * as MLService from '../generated/ml_service';

import { ReadingTimespan } from '../generated/reading';

export function build(app: Express) {
	app.get(
		'/api/heatmap',
		/*requireAuth(),*/ async (req, res) => {
			//const { isAuthenticated } = getAuth(req)
			//if (!isAuthenticated) {
			//  return res.status(401).send({ 'message': 'Unauthorized' });
			//}

			console.log('Received /api/heatmap request with query:', req.query);
			try {
				const fetchRes = await MLServiceClient.FetchLatestData(
					MLService.FetchLatestDataRequest.create({}),
				);

				console.log('FetchLatestData response:', fetchRes);
				res.send(fetchRes);
			} catch (error) {
				console.error('Error processing /api/heatmap request:', error);
				return res.status(400).send({ message: 'Bad Request' });
			}

			return;
		},
	);
}
