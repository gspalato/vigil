import { useUser } from '@clerk/clerk-expo';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import GeoJSON from 'geojson';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, {
	Geojson,
	Heatmap,
	Polyline,
	PROVIDER_GOOGLE,
	Region,
} from 'react-native-maps';
import {
	SafeAreaView,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { HomeHeader } from '@/components/HomeHeader';
import { HomeNavbar } from '@/components/HomeNavbar';

import { useApi } from '@lib/api';
import { useAppTheme } from '@lib/Theme';
import {
	getApproximateScreenCornerRadius,
	useGoogleMapIosPerfFix,
} from '@lib/utils';

export default function Page() {
	const { themeName } = useAppTheme();

	const [alertCount, setAlertCount] = useState<number>(0);

	const { geoJSON, fetchLatestGeoJSON } = useApi();
	useEffect(() => {
		fetchLatestGeoJSON();
		//fetchHeatmapData({ timespan: 'MONTH' });
	}, []);

	useGoogleMapIosPerfFix();
	const [initialRegion, setInitialRegion] = useState<Region | null>(null);

	useEffect(() => {
		(async () => {
			const { status } =
				await Location.requestForegroundPermissionsAsync();
			if (status !== 'granted') {
				console.log('Permission to access location was denied');
				return;
			}

			const location = await Location.getCurrentPositionAsync({});
			const { latitude, longitude } = location.coords;

			// Set initial region for the map
			setInitialRegion({
				latitude,
				longitude,
				latitudeDelta: 0.01, // zoom level (small delta = closer)
				longitudeDelta: 0.01,
			});
		})();
	}, []);

	const googleMapsTheme =
		themeName === 'dark'
			? 'd6f5630a06421fd4d6705cde'
			: 'd6f5630a06421fd44ad483f1';

	return (
		<>
			<StatusBar style='light' />
			<View style={styles.container}>
				<HomeHeader alertCount={alertCount} />
				<MapView
					provider={PROVIDER_GOOGLE}
					googleMapId={'d6f5630a06421fd4d6705cde'}
					style={styles.map}
					initialRegion={initialRegion ?? undefined}
					region={initialRegion ?? undefined}
					showsUserLocation
					followsUserLocation
					onPanDrag={() => {}} // Fix for low framerate when interacting with the map on iOS.
					key={'a'}
				>
					{geoJSON && (
						<Geojson
							geojson={geoJSON as any}
							strokeColor='#002299'
							fillColor='#00229933'
							strokeWidth={2}
						/>
					)}
					{/*
					<Heatmap
						points={heatmapPoints.map((p) => ({
							latitude: p.location.lat,
							longitude: p.location.lon,
							weight: p.intensity,
						}))}
						radius={50}
						gradient={{
							colors: [
								'#0000ff',
								'#00ff00',
								'#ffff00',
								'#ff0000',
							], // blue → green → yellow → red
							startPoints: [0.1, 0.3, 0.6, 1], // positions along gradient
							colorMapSize: 256,
						}}
						opacity={0.9}
					/>
					*/}
				</MapView>
			</View>
			<MaskedView
				style={{
					position: 'absolute',
					width: '100%',
					height: 140,
					pointerEvents: 'none',
					opacity: 0,
				}}
				maskElement={
					<LinearGradient
						colors={['rgba(0,0,0,.5)', 'rgba(0,0,0,0)']} // Adjust colors for desired blur transition
						style={StyleSheet.absoluteFill}
					/>
				}
			>
				<BlurView
					intensity={1000}
					tint='dark'
					style={StyleSheet.absoluteFill}
				/>
			</MaskedView>
			<SafeAreaView
				style={{
					position: 'absolute',
					flex: 1,
					width: '100%',
					height: '100%',
					justifyContent: 'flex-end',
					pointerEvents: 'box-none',
				}}
			>
				<HomeNavbar />
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000000',
	},
	map: {
		width: '100%',
		height: '108%',
		borderTopLeftRadius: getApproximateScreenCornerRadius().dp,
		borderTopRightRadius: getApproximateScreenCornerRadius().dp,
		overflow: 'hidden',
	},
	appName: {
		//position: 'absolute',
		fontWeight: 'bold',
		color: '#ffffff',
		fontFamily: 'InstrumentSerif_400Regular',
		fontSize: 48,
		textShadowColor: '#00000066',
		textShadowOffset: {
			width: 0,
			height: 0,
		},
		textShadowRadius: 10,
		paddingLeft: 5,
		paddingRight: 5,
	},
	profileButton: {
		height: 35,
		width: 35,
		borderRadius: 10,
		borderColor: '#ffffff',
		borderWidth: 2.5,
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 0,
		},
		shadowOpacity: 1,
		shadowRadius: 5,
	},
	toolbarContainer: {
		position: 'absolute',
		top: 200,
		left: 50,
		width: 250,
		height: 100,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	toolbar: {
		height: 50,
		width: 'auto',
		borderRadius: 50,
		//marginHorizontal: "auto",
		gap: 10,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 8,
		flexDirection: 'row',
	},
	toolbarButton: {
		height: 35,
		width: 35,
		borderRadius: 35,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
