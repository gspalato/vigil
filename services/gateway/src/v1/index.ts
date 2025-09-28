import { clerkMiddleware } from '@clerk/express';
import express, { Request, Response } from 'express';
import {
	createConfig,
	createServer,
	DependsOnMethod,
	Routing,
} from 'express-zod-api';

import { FetchHeatmapEndpoint } from './routes/heatmap';
import { TriggerReadingsAnalysisJobEndpoint } from './routes/internal';
import { FetchReportsEndpoint, LogReportEndpoint } from './routes/reports';

import { clerkClient } from '../clerk';

const routing: Routing = {
	v1: {
		'/internal/readings': new DependsOnMethod({
			post: TriggerReadingsAnalysisJobEndpoint,
		}),

		'/reports': new DependsOnMethod({
			get: FetchReportsEndpoint,
			post: LogReportEndpoint,
		}),

		'/heatmap': new DependsOnMethod({
			get: FetchHeatmapEndpoint,
		}),
	},
};

const config = createConfig({
	http: {
		listen: {
			host: process.env.HOST ?? '0.0.0.0',
			port: process.env.PORT ? Number(process.env.PORT) : 3000,
		},
	},
	cors: false,
	beforeRouting: ({ app, getLogger }) => {
		const logger = getLogger();
		logger.info('Serving Gateway v1 on port %s', process.env.PORT || 3000);

		app.use(
			clerkMiddleware({
				clerkClient,
				publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
			}),
		);
		app.use(express.json());
	},
});

export function start() {
	createServer(config, routing);
}
