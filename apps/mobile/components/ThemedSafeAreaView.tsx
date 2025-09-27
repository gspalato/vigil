import { SafeAreaView, View } from 'moti';
import React, { ComponentProps } from 'react';
import { ColorValue, StyleSheet, useColorScheme } from 'react-native';

import { ThemedProps, useAppTheme } from '@lib/Theme';

type ThemedSafeAreaViewProps = {
	thinBorder?: boolean;
	elevation?: 'transparent' | 'background' | 'surface' | 'raised' | 'overlay';
} & ThemedProps &
	ComponentProps<typeof View>;

export const ThemedSafeAreaView: React.FC<ThemedSafeAreaViewProps> = (
	props,
) => {
	const {
		children,
		style,
		thinBorder,
		elevation = 'transparent',
		themeOverride,
	} = props;

	const { theme } = useAppTheme(themeOverride);

	const mapElevationToBackgroundColor: {
		[key in NonNullable<ThemedSafeAreaViewProps['elevation']>]: ColorValue;
	} = {
		transparent: 'transparent',
		background: theme.colors.background,
		surface: theme.colors.surface,
		raised: theme.colors.surface,
		overlay: theme.colors.surface,
	};

	return (
		<SafeAreaView
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
		>
			{children}
		</SafeAreaView>
	);
};
