import { set } from 'date-fns';
import { View } from 'moti';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useAnimatedStyle } from 'react-native-reanimated';

import { ThemedProps, useAppTheme } from '@lib/Theme';

type ButtonProps = {
	pressableStyle?: StyleProp<ViewStyle>;
	viewStyle?: StyleProp<ViewStyle>;
	children: React.ReactNode;

	onPress?: () => void;
	onHold?: () => void;
} & ThemedProps;

export const ThemedButton: React.FC<ButtonProps> = ({
	pressableStyle,
	viewStyle,
	children,
	onPress,
	onHold,
	themeOverride,
}) => {
	const { theme } = useAppTheme(themeOverride);

	const [isBeingPressed, setIsBeingPressed] = useState(false);

	const viewAnimationStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					scale: isBeingPressed ? 0.95 : 1,
				},
			],
		};
	});

	return (
		<Pressable
			style={[{}, pressableStyle]}
			onPressIn={() => setIsBeingPressed(true)}
			onPressOut={() => setIsBeingPressed(false)}
			onPress={onPress}
			onLongPress={onHold}
		>
			<View
				style={[
					{
						padding: 12,
						backgroundColor: theme.colors.surface,
						borderColor: theme.colors.border,
						borderRadius: theme.borderRadii.sm,
					},
					viewStyle,
				]}
				animate={{
					scale: isBeingPressed ? 0.95 : 1,
					backgroundColor: isBeingPressed
						? theme.colors.surface + 'DD'
						: theme.colors.surface + 'FF',
					borderColor: theme.colors.border,
				}}
				transition={{
					duration: 100,
				}}
			>
				{children}
			</View>
		</Pressable>
	);
};
