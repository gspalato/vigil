import React, { useEffect, useState } from 'react';
import { ViewProps } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

type SplitButtonsProps = {
	splitted: boolean;
	gap?: number;
	offsetMultiplier?: number;
	leftButton: (style: any) => React.ReactNode;
	rightButton: (style: any) => React.ReactNode;
} & ViewProps;

export const SplitButtons2: React.FC<SplitButtonsProps> = ({
	splitted = true,
	gap = 10,
	offsetMultiplier = 0.3,
	leftButton,
	rightButton,
	style,
	...viewProps
}) => {
	const [containerWidth, setContainerWidth] = useState(0);
	const progress = useSharedValue(splitted ? 1 : 0);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		// Only set progress after we have container width
		if (!isMounted && containerWidth > 0) {
			progress.value = splitted ? 1 : 0; // set directly, no animation
			setIsMounted(true);
		} else if (isMounted) {
			progress.value = withTiming(splitted ? 1 : 0, { duration: 250 });
		}
	}, [splitted, progress, containerWidth]);

	const leftButtonStyle = useAnimatedStyle(() => {
		const leftWidth =
			progress.value *
			(containerWidth - gap) *
			(0.5 - offsetMultiplier / 2);
		return {
			width: leftWidth,
			opacity: leftWidth > 0 ? 1 : 0,
			overflow: 'hidden',
		};
	});

	const rightButtonStyle = useAnimatedStyle(() => {
		const expandedWidth =
			(containerWidth - gap) * (0.5 + offsetMultiplier / 2);
		const collapsedWidth = containerWidth;

		const width = withTiming(
			progress.value > 0 ? expandedWidth : collapsedWidth,
			{ duration: 250 },
		);

		return {
			position: 'absolute',
			right: 0,
			width,
		};
	});

	// Don't render buttons until we have container width
	if (containerWidth === 0) {
		return (
			<Animated.View
				style={[
					style,
					{
						flexDirection: 'row',
						position: 'relative',
						opacity: 0, // Hide until measured
					},
				]}
				onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
				{...viewProps}
			>
				{leftButton?.({})}
				{rightButton?.({})}
			</Animated.View>
		);
	}

	return (
		<Animated.View
			style={[
				style,
				{
					flexDirection: 'row',
					position: 'relative',
				},
			]}
			{...viewProps}
		>
			{leftButton?.(leftButtonStyle)}
			{rightButton?.(rightButtonStyle)}
		</Animated.View>
	);
};
