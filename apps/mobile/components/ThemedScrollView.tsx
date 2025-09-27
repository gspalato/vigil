import { ScrollView } from 'moti';
import React, { ComponentProps } from 'react';
import { ColorValue, StyleSheet, useColorScheme, View } from 'react-native';

import { ThemedProps, useAppTheme } from '@lib/Theme';

type ThemedScrollViewProps = {
	thinBorder?: boolean;
	elevation?: 'transparent' | 'background' | 'surface' | 'raised' | 'overlay';
} & ThemedProps &
	ComponentProps<typeof ScrollView>;

export const ThemedScrollView: React.FC<ThemedScrollViewProps> = (props) => {
	const {
		children,
		style,
		contentContainerStyle,
		thinBorder,
		elevation = 'background',
		themeOverride,
	} = props;

	const { theme } = useAppTheme(themeOverride);

	const mapElevationToBackgroundColor: {
		[key in NonNullable<ThemedScrollViewProps['elevation']>]: ColorValue;
	} = {
		transparent: 'transparent',
		background: theme.colors.background,
		surface: theme.colors.surface,
		raised: theme.colors.surface,
		overlay: theme.colors.surface,
	};

	return (
		<ScrollView
			style={[
				{
					backgroundColor: mapElevationToBackgroundColor[elevation],
					borderColor: theme.colors.border,
					borderWidth: thinBorder ? StyleSheet.hairlineWidth : 0,
				},
				style,
			]}
			contentContainerStyle={contentContainerStyle}
			animate={{
				backgroundColor: mapElevationToBackgroundColor[elevation],
				borderColor: theme.colors.border,
				borderWidth: thinBorder ? StyleSheet.hairlineWidth : 0,
			}}
			transition={{
				duration: 100,
			}}
		>
			{children}
		</ScrollView>
	);
};
