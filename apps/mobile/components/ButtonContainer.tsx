import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from 'heroui-native';
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

type IButtonContainerProps = {
	style?: ViewStyle;
	onPress: () => void;
	impact?: Haptics.ImpactFeedbackStyle;
} & React.PropsWithChildren;

export const ThemedButtonContainer: React.FC<IButtonContainerProps> = (
	props,
) => {
	const { children, onPress, style, impact } = props;

	const _onPress = () => {
		Haptics.impactAsync(impact ?? Haptics.ImpactFeedbackStyle.Light);
		onPress();
	};

	return <Pressable onPress={_onPress}>{children}</Pressable>;
};

const styles = StyleSheet.create({
	button: {
		padding: 12,
		borderRadius: 8,
		backgroundColor: 'blue',
	},
	buttonText: {
		color: 'white',
		textAlign: 'center',
	},
});
