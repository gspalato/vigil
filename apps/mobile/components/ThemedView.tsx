import { View } from 'moti';
import React, { ComponentProps } from 'react';
import { ColorValue, StyleSheet, useColorScheme } from 'react-native';

import { ThemedProps, useAppTheme } from '@lib/Theme';

type ThemedViewProps = {
	thinBorder?: boolean;
	elevation?: 'transparent' | 'background' | 'surface' | 'raised' | 'overlay';
} & ThemedProps &
	ComponentProps<typeof View>;

export const ThemedView: React.FC<ThemedViewProps> = (props) => {
	const {
		children,
		style,
		thinBorder,
		elevation = 'transparent',
		themeOverride,
		...viewProps
	} = props;

	const { theme } = useAppTheme(themeOverride);

	const mapElevationToBackgroundColor: {
		[key in NonNullable<ThemedViewProps['elevation']>]: ColorValue;
	} = {
		transparent: 'transparent',
		background: theme.colors.background,
		surface: theme.colors.surface,
		raised: theme.colors.surface,
		overlay: theme.colors.surface,
	};

	return (
		<View
			style={[
				{
					backgroundColor: mapElevationToBackgroundColor[elevation],
					borderColor: theme.colors.border,
					borderWidth: thinBorder ? StyleSheet.hairlineWidth : 0,
				},
				style,
			]}
			animate={{
				backgroundColor: mapElevationToBackgroundColor[elevation],
				borderColor: theme.colors.border,
			}}
			transition={{
				duration: 100,
			}}
			{...viewProps}
		>
			{children}
		</View>
	);
};
