import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';

type BlurGradientOverlayProps = {
	intensity?: number;
	tint?:
		| 'light'
		| 'dark'
		| 'default'
		| 'systemMaterialDark'
		| 'systemChromeMaterialDark';
	style?: ViewStyle;
	children?: React.ReactNode;
	// Gradient control
	startColor?: string; // color at start of gradient
	endColor?: string; // color at end of gradient
	startLocation?: number; // 0–1
	endLocation?: number; // 0–1
	direction?: 'vertical' | 'horizontal';
};

const BlurGradientOverlay: React.FC<BlurGradientOverlayProps> = ({
	intensity = 100,
	tint,
	style,
	children,
	startColor = 'transparent',
	endColor = 'black',
	startLocation = 0,
	endLocation = 1,
	direction = 'vertical',
}) => {
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);

	// Generate gradient stops with easing
	const { colors, locations } = easeGradient({
		colorStops: {
			[startLocation]: { color: startColor },
			0.5: { color: 'rgba(0,0,0,0.99)' },
			[endLocation]: { color: endColor },
		},
	});

	// Gradient start/end vectors
	const startVec = direction === 'vertical' ? { x: 0, y: 0 } : { x: 0, y: 0 };
	const endVec =
		direction === 'vertical' ? { x: 0, y: height } : { x: width, y: 0 };

	return (
		<View
			style={[{ width, height }, style]}
			onLayout={(e) => {
				setWidth(e.nativeEvent.layout.width);
				setHeight(e.nativeEvent.layout.height);
			}}
		>
			<MaskedView
				maskElement={
					<LinearGradient
						start={startVec}
						end={endVec}
						colors={colors as [string, string, ...string[]]} // cast to tuple
						locations={locations as [number, number, ...number[]]} // cast to tuple
						style={StyleSheet.absoluteFill}
					/>
				}
				style={StyleSheet.absoluteFill}
			>
				<BlurView
					intensity={intensity}
					tint={
						tint ??
						(Platform.OS === 'ios'
							? 'systemChromeMaterialDark'
							: 'systemMaterialDark')
					}
					style={StyleSheet.absoluteFill}
				/>
			</MaskedView>
			{children && (
				<View style={StyleSheet.absoluteFill}>{children}</View>
			)}
		</View>
	);
};

export default BlurGradientOverlay;
