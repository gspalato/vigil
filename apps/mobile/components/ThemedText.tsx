import { useTheme } from '@shopify/restyle';
import { Text } from 'moti';
import { PropsWithChildren } from 'react';
import { StyleSheet, TextProps, TextStyle } from 'react-native';

import { Theme, ThemeName, useAppTheme } from '@lib/Theme';

type ThemedTextProps = {
	size?: keyof typeof textSize;
	type?: 'title' | 'body' | 'secondary' | 'tertiary' | 'caption' | 'button'; // Future use for different text types
	themeOverride?: ThemeName;
} & TextProps;

const textSize = {
	xs: {
		fontSize: 14,
	},
	sm: {
		fontSize: 16,
	},
	md: {
		fontSize: 20,
	},
	lg: {
		fontSize: 32,
	},
	xl: {
		fontSize: 42,
	},
};

export const ThemedText = ({
	children,
	style,
	size = 'md',
	type = 'body',
	themeOverride,
	...props
}: ThemedTextProps) => {
	const { theme } = useAppTheme(themeOverride);

	const styles = StyleSheet.create({
		text: {
			color: theme.colors.textPrimary,
			fontFamily: 'InstrumentSans_600SemiBold',
		},
		title: {
			fontFamily: 'InstrumentSerif_400Regular',
			fontSize: 32,
			letterSpacing: -0.5,
		},
		body: {
			fontFamily: 'InstrumentSans_400Regular',
			fontSize: 16,
		},
		secondary: {
			fontFamily: 'InstrumentSans_400Regular',
			color: theme.colors.textSecondary,
		},
		tertiary: {
			fontFamily: 'InstrumentSans_400Regular',
			color: theme.colors.textTertiary,
		},
		caption: {
			fontFamily: 'InstrumentSans_400Regular',
			fontSize: 12,
		},
		button: {
			fontFamily: 'InstrumentSans_600SemiBold',
			fontSize: 12,
		},
		bold: {
			fontFamily: 'InstrumentSans_700Bold',
		},
		extraBold: {
			fontFamily: 'InstrumentSans_800ExtraBold',
		},
	});

	const mergedStyle = StyleSheet.flatten([
		styles.text,
		styles[type] as TextStyle,
		size && textSize[size],
		style,
	]);

	return (
		<Text
			{...props}
			style={[
				styles.text,
				styles[type] as TextStyle,
				size && textSize[size],
				style,
			]}
			animate={{
				// @ts-expect-error
				color: mergedStyle.color ?? theme.colors.textPrimary,
				// @ts-expect-error
				fontSize: mergedStyle.fontSize,
			}}
			transition={{ duration: 100 }}
		>
			{children}
		</Text>
	);
};
