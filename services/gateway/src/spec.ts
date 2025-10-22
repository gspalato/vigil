import { Tspec } from 'tspec';

import {
	CalculateReadingRequest,
	InferSymptomsAndCauseRequest,
	InferSymptomsAndCauseResponse,
} from '@generated/analytics_service';
import { Reading } from '@generated/reading';
import { SymptomReport } from '@generated/symptom_report';
import { FetchLatestDataResponse } from './generated/ml_service';

export type GatewayApiSpec = Tspec.DefineApiSpec<{
	paths: {
		// Internal
		'/api/internal/readings': {
			post: {
				summary: 'Trigger a reading analysis job.';
				header: {
					Authorization: string;
				};
				body: CalculateReadingRequest;
				responses: {
					200: { reading: Reading };
					400: { message: string };
					401: { message: 'Unauthorized' };
					403: { message: 'Forbidden' };
				};
			};
		};

		// Reports
		'/api/reports': {
			get: {
				summary: 'Get all reports for the authenticated user';
				header: {
					Authorization: string;
				};
				responses: {
					200: { reports: SymptomReport[] };
					400: {
						message: string;
					};
					401: {
						message: 'Unauthorized';
					};
				};
			};
			post: {
				summary: 'Create a new report';
				header: {
					Authorization: string;
				};
				body: InferSymptomsAndCauseRequest & {
					location: { lat: number; lon: number };
				};
				responses: {
					200: InferSymptomsAndCauseResponse;
					400: {
						message: string;
					};
					401: {
						message: 'Unauthorized';
					};
				};
			};
		};

		// Heatmap
		'/api/heatmap': {
			get: {
				summary: 'Get heatmap data points';
				query: {};
				responses: {
					200: FetchLatestDataResponse;
					400: {
						message: string;
					};
					401: {
						message: 'Unauthorized';
					};
				};
			};
		};
	};
}>;
