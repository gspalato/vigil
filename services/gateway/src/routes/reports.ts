import { getAuth } from '@clerk/express';
import type { Express } from 'express';

import { AnalyticsServiceClient } from '../clients';

import { supabase } from '../db';

import * as AnalyticsService from '../generated/analytics_service';
import { ReadingTimespan } from '../generated/reading';

export function build(app: Express) {
	app.get('/api/reports', async (req, res) => {
		const auth = getAuth(req);

		// Handle pending sessions - they're valid but not fully activated
		if (!auth.isAuthenticated) {
			return res.status(401).send({ message: 'Unauthorized' });
		}

		const { data, error } = await supabase
			.from('reports')
			.select('*')
			.eq('user_id', auth.userId);

		if (error) {
			console.log('Error fetching reports from database:', error);
			return res.status(500).send({ message: 'Failed to fetch reports' });
		}

		res.send({ reports: data });

		return;
	});

	app.post('/api/reports', async (req, res) => {
		console.log('Received /api/reports request with body:', req.body);
		const auth = getAuth(req);

		// Handle pending sessions - they're valid but not fully activated
		if (!auth.isAuthenticated) {
			console.log(
				'Unauthorized request to /api/reports. Auth status:',
				auth,
			);
			return res.status(401).send({ message: 'Unauthorized' });
		}

		console.log(req.body);
		const reportRes = await AnalyticsServiceClient.InferSymptomsAndCause(
			AnalyticsService.InferSymptomsAndCauseRequest.create({
				text: req.body.text,
			}),
		);

		console.log('InferSymptomsAndCause response:', reportRes);

		if (!reportRes.success) {
			return res
				.status(400)
				.send({ message: 'Failed to analyze symptoms' });
		}

		const { data, error } = await supabase.from('reports').insert({
			user_id: auth.userId,
			timestamp: new Date(),
			symptoms: reportRes.symptoms,
			cause: reportRes.cause,
			notes: null,
			lat: req.body.location?.lat,
			lon: req.body.location?.lon,
		});

		if (error) {
			console.log('Error inserting report into database:', error);
			return res.status(500).send({ message: 'Failed to save report' });
		}

		console.log('Inserted report into database:', data);

		res.send(reportRes);

		return;
	});
}
