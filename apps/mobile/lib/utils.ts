import { Dimensions, PixelRatio, Platform } from 'react-native';
// useGoogleMapIosPerfFix.ios.ts
import {
	Easing,
	useDerivedValue,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

export function getApproximateScreenCornerRadius() {
	const { width, height } = Dimensions.get('window');
	const scale = PixelRatio.get();

	// Use the smaller dimension (in dp/points)
	const minDim = Math.min(width, height);

	let factor = 0.08; // default heuristic (8% of width)

	if (Platform.OS === 'ios') {
		// iOS devices tend to have slightly rounder corners
		factor = 0.09;
	} else if (Platform.OS === 'android') {
		// Android OEMs vary, stay conservative
		factor = 0.07;
	}

	// Corner radius in dp/points
	const radiusDp = minDim * factor;

	// Convert to pixels if needed
	const radiusPx = radiusDp * scale;

	return {
		dp: Math.round(radiusDp),
		px: Math.round(radiusPx),
	};
}

export function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Fix Google Maps dragging/panning not smooth on iOS
 * @see https://github.com/react-native-maps/react-native-maps/issues/4937#issuecomment-2393609394
 */
export const useGoogleMapIosPerfFix = () => {
	const xPosition = useSharedValue(0);

	// Why it works
	// React native reanimated, force the ui tread to update, and force an higher frame rate
	useDerivedValue(() => {
		xPosition.value = 0;
		xPosition.value = withRepeat(
			withTiming(100, {
				duration: 2000,
				easing: Easing.linear,
			}),
			-1,
		);
	}, []);
};

export function hexToRgbaTuple(
	hex: string,
	alpha = 1,
): [number, number, number, number] {
	// Remove the '#' if present
	const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

	let r, g, b, a;

	if (cleanHex.length === 3) {
		// #rgb format
		r = parseInt(cleanHex[0] + cleanHex[0], 16);
		g = parseInt(cleanHex[1] + cleanHex[1], 16);
		b = parseInt(cleanHex[2] + cleanHex[2], 16);
		a = alpha;
	} else if (cleanHex.length === 6) {
		// #rrggbb format
		r = parseInt(cleanHex.slice(0, 2), 16);
		g = parseInt(cleanHex.slice(2, 4), 16);
		b = parseInt(cleanHex.slice(4, 6), 16);
		a = alpha;
	} else if (cleanHex.length === 8) {
		// #rrggbbaa format
		r = parseInt(cleanHex.slice(0, 2), 16);
		g = parseInt(cleanHex.slice(2, 4), 16);
		b = parseInt(cleanHex.slice(4, 6), 16);
		a = parseInt(cleanHex.slice(6, 8), 16) / 255; // Convert hex alpha to a 0-1 float
	} else {
		// Handle invalid hex input (e.g., return black or throw error)
		console.warn('Invalid hex color string provided:', hex);
		return [0, 0, 0, 1]; // Default to opaque black
	}

	return [r, g, b, a];
}
