import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import { UserResource, UseUserReturn } from '@clerk/types';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

import * as API from './generated/api';
import { createClient } from './generated/api/client';

// Types
type HeatmapPoint = {
	radius: number;
	location: {
		lat: number;
		lon: number;
	};
	intensity: number;
};

enum FetchHeatmapPointsTimespan {
	HOUR = 'HOUR',
	DAY = 'DAY',
	WEEK = 'WEEK',
	MONTH = 'MONTH',
}

// Context
export type VigilAPIContextType = {
	heatmapPoints: HeatmapPoint[];
	fetchHeatmapPoints: (params?: {
		timespan?: FetchHeatmapPointsTimespan | `${FetchHeatmapPointsTimespan}`;
	}) => Promise<void>;

	myReports: any[]; // TODO: Define report type
	fetchMyReports: () => Promise<void>;
	reportSymptoms: (
		text: string,
	) => Promise<
		| API.GatewayApiSpecPostApiReportsResponse
		| { success: false; message: string }
	>;
};

const VigilAPIContext = createContext<VigilAPIContextType | undefined>(
	undefined,
);

export const useApi = () => {
	const context = useContext(VigilAPIContext);
	if (!context) {
		throw new Error('useApi must be used within a VigilAPIProvider');
	}
	return context;
};

export const VigilAPIProvider: React.FC<React.PropsWithChildren> = ({
	children,
}) => {
	const clerkAuth = useAuth();
	const { user } = useUser();

	const gatewayClientOpenAPISDK = createClient({
		baseUrl: process.env.EXPO_PUBLIC_VIGIL_BACKEND_URL,
	});

	const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
	const fetchHeatmapPoints = async (params?: {
		timespan?: FetchHeatmapPointsTimespan | `${FetchHeatmapPointsTimespan}`;
		similarity?: string[] | string | undefined;
	}) => {
		try {
			const res = await API.gatewayApiSpecGetApiHeatmap({
				query: {
					timespan: params?.timespan ?? 'MONTH',
					similarity: params?.similarity ?? '',
				},
				client: gatewayClientOpenAPISDK,
			});

			if (res.error) {
				throw new Error(
					`Error fetching heatmap points: ${res.error.message}`,
				);
			}

			const points = res.data.heatmapPoints.map((h) => h.points).flat();
			console.log('Fetched heatmap points:', points);
			setHeatmapPoints(points);
		} catch (error) {
			console.error('Failed to fetch heatmap points:', error);
			return;
		}
	};

	const [myReports, setMyReports] = useState<API.SymptomReport[]>([]);
	const fetchMyReports = async () => {
		try {
			const token = await clerkAuth.getToken();
			if (!token) {
				console.warn('No auth token available for fetching reports');
				return;
			} else {
				console.log(token);
			}

			const res = await API.gatewayApiSpecGetApiReports({
				client: gatewayClientOpenAPISDK,
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (res.error) {
				console.error('Failed to fetch my reports:', res.error);
				return;
			}

			setMyReports(res.data.reports);
		} catch (error) {
			console.error('Failed to fetch reports (catch):', error);
			return;
		}
	};
	const reportSymptoms = async (
		text: string,
	): Promise<
		API.InferSymptomsAndCauseResponse | { success: false; message: string }
	> => {
		try {
			const token = await clerkAuth.getToken();
			const location = await Location.getCurrentPositionAsync();
			const res = await API.gatewayApiSpecPostApiReports({
				body: {
					text,
					location: {
						lat: location.coords.latitude,
						lon: location.coords.longitude,
					},
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
				client: gatewayClientOpenAPISDK,
			});

			if (res.error) {
				return {
					success: false,
					message: res.error.message || 'Unknown error',
				};
			}

			return res.data;
		} catch (error) {
			console.error('Failed to report symptoms:', error);
			return {
				success: false,
				message: (error as Error).message || 'Unknown error',
			};
		}
	};

	return (
		<VigilAPIContext.Provider
			value={{
				heatmapPoints,
				fetchHeatmapPoints,

				myReports,
				fetchMyReports,
				reportSymptoms,
			}}
		>
			{children}
		</VigilAPIContext.Provider>
	);
};
