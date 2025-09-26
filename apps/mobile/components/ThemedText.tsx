import { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

type ThemedTextProps = {
	size?: keyof typeof textSize;
	type?: 'title' | 'body' | 'caption' | 'button'; // Future use for different text types
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
	...props
}: ThemedTextProps) => {
	return (
		<Text
			{...props}
			style={[
				styles.text,
				type === 'title' && styles.title,
				type === 'body' && styles.body,
				type === 'caption' && styles.caption,
				type === 'button' && styles.button,
				size && textSize[size],
				style,
			]}
		>
			{children}
		</Text>
	);
};

const styles = StyleSheet.create({
	text: {
		color: '#000',
		fontFamily: 'InstrumentSans_600SemiBold',
	},
	title: {
		fontFamily: 'InstrumentSerif_400Regular',
		fontSize: 32,
	},
	body: {
		fontFamily: 'InstrumentSans_400Regular',
		fontSize: 16,
	},
	caption: {
		fontFamily: 'InstrumentSans_400Regular',
		fontSize: 12,
		color: '#555',
	},
	button: {
		fontFamily: 'InstrumentSans_600SemiBold',
		fontSize: 12,
		color: '#000',
	},
	bold: {
		fontFamily: 'InstrumentSans_700Bold',
	},
	extraBold: {
		fontFamily: 'InstrumentSans_800ExtraBold',
	},
});
