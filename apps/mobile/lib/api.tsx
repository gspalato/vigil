import { useAuth, useClerk, useUser } from '@clerk/clerk-expo';
import { UserResource, UseUserReturn } from '@clerk/types';
import { set } from 'date-fns';
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
	// Internal endpoints. Not exposed to normal users.
	// Used for testing and development.
	// They are protected by Clerk authentication.

	triggerReadingAnalysis: (
		timespan: API.ReadingTimespan,
	) => Promise<API.Reading | undefined>;

	geoJSON: string | { [key: string]: any } | undefined;
	fetchLatestGeoJSON: () => Promise<void>;

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

	const gatewayClientOpenAPISDK = createClient({
		baseUrl: process.env.EXPO_PUBLIC_VIGIL_BACKEND_URL,
	});

	const triggerReadingAnalysis = async (timespan: API.ReadingTimespan) => {
		try {
			const token = await clerkAuth.getToken();
			if (!token) {
				console.warn(
					'No auth token available for triggering reading analysis',
				);
				return;
			}

			const res = await API.gatewayApiSpecPostApiInternalReadings({
				body: {
					timespan,
				},
				headers: {
					Authorization: `Bearer ${token}`,
				},
				client: gatewayClientOpenAPISDK,
			});

			if (res.error) {
				console.error('Failed to trigger reading analysis:', res.error);
				return;
			}

			return res.data.reading;
		} catch (error) {
			console.error('Failed to trigger reading analysis (catch):', error);
			return;
		}
	};

	const [geoJSON, setGeoJSON] = useState<VigilAPIContextType['geoJSON']>();
	const fetchLatestGeoJSON = async () => {
		try {
			const res = await API.mapControllerGetHeatmapV1({
				client: gatewayClientOpenAPISDK,
			});

			if (res.error) {
				throw new Error(
					`Error fetching heatmap splines: ${res.error.message}`,
				);
			}

			if (!res.data.geojson || res.data.geojson === '') {
				console.warn('No geoJSON data received for heatmap');
				return;
			}

			console.log(res.data);
			console.log('Fetched GeoJSON:', res.data.geojson);
			setGeoJSON(JSON.parse(res.data.geojson));
		} catch (error) {
			console.error('Failed to fetch heatmap points:', error);
			return;
		}
	};
	/*
	const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
	const fetchHeatmapData = async (params?: {
		timespan?: FetchHeatmapPointsTimespan | `${FetchHeatmapPointsTimespan}`;
		similarity?: string[] | string | undefined;
	}) => {
		console.log('Fetching heatmap data with params:', params);
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

			console.log('Fetched heatmap data:', res.data);
			setHeatmapPoints(res.data.heatmapPoints);

			if (res.data.geojson === '') {
				console.warn('No geoJSON data received for heatmap');
				return;
			}

			setGeoJSON(JSON.parse(res.data.geojson));
		} catch (error) {
			console.error('Failed to fetch heatmap points:', error);
			return;
		}
	};
	*/

	const [myReports, setMyReports] = useState<API.SymptomReport[]>([]);
	const fetchMyReports = async () => {
		console.log('Fetching my reports...');
		try {
			const token = await clerkAuth.getToken();
			if (!token) {
				console.warn('No auth token available for fetching reports');
				return;
			}

			const res = await API.reportsControllerGetAllUserReportsV1({
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
	): Promise<{ success: false; message: string }> => {
		try {
			const token = await clerkAuth.getToken();
			const location = await Location.getCurrentPositionAsync();
			const res = await API.reportsControllerRegisterUserReportV1({
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
				triggerReadingAnalysis,

				geoJSON,
				fetchLatestGeoJSON,
				//heatmapPoints,
				//fetchHeatmapData,

				myReports,
				fetchMyReports,
				reportSymptoms,
			}}
		>
			{children}
		</VigilAPIContext.Provider>
	);
};
