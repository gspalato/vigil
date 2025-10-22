import { Canvas, Fill, LinearGradient, vec } from '@shopify/react-native-skia';
import { set } from 'date-fns';
import { View } from 'moti';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
	interpolateColor,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

import { ThemedProps, ThemeName, useAppTheme } from '@lib/Theme';

type ThemedGradientButton = {
	pressableStyle?: StyleProp<ViewStyle>;
	viewStyle?: StyleProp<ViewStyle>;
	children: React.ReactNode;

	hitSlop?: number;

	onPress?: () => void;
	onHold?: () => void;
} & ThemedProps;

export const ThemedGradientButton: React.FC<ThemedGradientButton> = ({
	pressableStyle,
	viewStyle,
	children,
	hitSlop = 20,
	onPress,
	onHold,
	themeOverride,
}) => {
	const { theme, themeName } = useAppTheme(themeOverride);

	const [isBeingPressed, setIsBeingPressed] = useState(false);

	const viewRef = useRef<typeof View>(null);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	useLayoutEffect(() => {
		// This will be called after the component is mounted and laid out
		// We can use it to get the dimensions of the view.

		// @ts-ignore
		viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
			setDimensions({ width, height });
			console.log('Measured dimensions:', { width, height });
		});
	}, [viewRef.current]);

	// Animated gradient colors
	const colorMap: Record<ThemeName, [string, string]> = {
		light: [theme.colors.surface, theme.colors.background],
		dark: [theme.colors.surface, theme.colors.surface],
		system: [theme.colors.surface, theme.colors.background],
	};

	const colorsValue = useSharedValue(1); // 0 for light, 1 for dark
	useEffect(() => {
		colorsValue.value = withTiming(themeName === 'light' ? 0 : 1, {
			duration: 100,
		});
	}, [themeName]);

	const gradientFirstColor = useSharedValue<string>(colorMap[themeName][0]);
	const gradientSecondColor = useSharedValue<string>(colorMap[themeName][1]);

	useDerivedValue(() => {
		gradientFirstColor.value = interpolateColor(
			colorsValue.value,
			[0, 1],
			[colorMap['light'][0], colorMap['dark'][0]],
		);
		gradientSecondColor.value = interpolateColor(
			colorsValue.value,
			[0, 1],
			[colorMap['light'][1], colorMap['dark'][1]],
		);
	});

	useDerivedValue(
		() => [gradientFirstColor.value, gradientSecondColor.value],
		[gradientFirstColor, gradientSecondColor],
	);

	return (
		<Pressable
			style={[{ backgroundColor: 'transparent' }, pressableStyle]}
			onPressIn={() => setIsBeingPressed(true)}
			onPressOut={() => setIsBeingPressed(false)}
			onPress={onPress}
			onLongPress={onHold}
			hitSlop={hitSlop}
		>
			<View
				ref={viewRef}
				onLayout={(e) => setDimensions(e.nativeEvent.layout)}
				style={[
					{
						padding: 12,
						//backgroundColor: theme.colors.surface,
						borderColor: theme.colors.border,
						borderRadius: theme.borderRadii.sm,
						borderWidth: StyleSheet.hairlineWidth,
						overflow: 'hidden',
					},
					viewStyle,
				]}
				animate={{
					scale: isBeingPressed ? 0.95 : 1,
					borderColor: theme.colors.border,
				}}
				transition={{
					duration: theme.durations.themeTransition,
				}}
			>
				<Canvas style={StyleSheet.absoluteFill}>
					<Fill>
						<LinearGradient
							start={vec(dimensions.width / 2, 0)}
							end={vec(dimensions.width / 2, dimensions.height)}
							colors={[
								gradientFirstColor.value,
								gradientSecondColor.value,
							]}
						/>
					</Fill>
				</Canvas>
				{children}
			</View>
		</Pressable>
	);
};
