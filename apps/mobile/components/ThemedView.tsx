import React, { ComponentProps } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';

import { Palette } from '@/lib/palette';

type ThemedViewProps = {
	thinBorder?: boolean;
	elevation?: 'background' | 'surface' | 'raised' | 'overlay';
} & ComponentProps<typeof View>;

export const ThemedView: React.FC<ThemedViewProps> = (props) => {
	const { children, style, thinBorder, elevation } = props;

	return (
		<View
			style={[
				{
					backgroundColor:
						elevation === 'background'
							? Palette.background
							: Palette.surface,
					borderColor: Palette.border,
					borderWidth: thinBorder ? StyleSheet.hairlineWidth : 0,
				},
				style,
			]}
		>
			{children}
		</View>
	);
};
