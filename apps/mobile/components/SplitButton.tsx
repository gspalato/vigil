import { PressableScale } from 'pressto';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
	LinearTransition,
	useAnimatedStyle,
	withTiming,
} from 'react-native-reanimated';

type SplitAction = {
	label: string;
	labelColor?: string;
	onPress: () => void;
	backgroundColor: string;
	icon?: React.ReactNode;
	iconVisible?: boolean;
};

type SplitButtonProps = {
	splitted: boolean;
	mainAction: SplitAction;
	leftAction: SplitAction;
	rightAction: SplitAction;
};

const ButtonHeight = 50;

const LayoutTransitionDefault = LinearTransition.duration(250);

export const SplitButton: React.FC<SplitButtonProps> = ({
	splitted,
	mainAction,
	leftAction,
	rightAction,
}) => {
	const { width: windowWidth } = useWindowDimensions();
	const [width, setWidth] = useState(0);

	useEffect(() => {
		console.log('got width', width);
	}, [width]);

	const paddingHorizontal = 0;
	const gap = 10;

	const splittedOffset = useMemo(() => width * 0.45, [width]);
	const LeftSplittedButtonWidth = useMemo(
		() => (width - paddingHorizontal * 2 - gap - splittedOffset) / 2,
		[width, paddingHorizontal, gap, splittedOffset],
	);
	const RightSplittedButtonWidth = useMemo(
		() => (width - paddingHorizontal * 2 - gap + splittedOffset) / 2,
		[width, paddingHorizontal, gap, splittedOffset],
	);

	const rLeftButtonStyle = useAnimatedStyle(() => {
		const leftButtonWidth = splitted ? LeftSplittedButtonWidth : 0;
		return {
			width: withTiming(leftButtonWidth),
			opacity: withTiming(splitted ? 1 : 0),
		};
	}, [splitted, LeftSplittedButtonWidth]);

	const rLeftTextStyle = useAnimatedStyle(() => {
		return {
			opacity: withTiming(splitted ? 1 : 0, {
				duration: 150,
			}),
		};
	}, [splitted]);

	const rMainButtonStyle = useAnimatedStyle(() => {
		const mainButtonWidth = splitted
			? RightSplittedButtonWidth
			: LeftSplittedButtonWidth + RightSplittedButtonWidth;
		return {
			width: withTiming(mainButtonWidth),
			marginLeft: withTiming(splitted ? gap : 0),
			backgroundColor: withTiming(
				splitted
					? rightAction.backgroundColor
					: mainAction.backgroundColor,
			),
		};
	}, [splitted, RightSplittedButtonWidth, LeftSplittedButtonWidth]);

	const rMainTextStyle = useAnimatedStyle(() => {
		return {
			opacity: withTiming(splitted ? 0 : 1),
		};
	}, [splitted]);

	const rRightTextStyle = useAnimatedStyle(() => {
		return {
			opacity: withTiming(splitted ? 1 : 0),
		};
	}, [splitted]);

	return (
		<View
			style={{
				width: '100%',
				height: ButtonHeight,
				paddingHorizontal,
				flexDirection: 'row',
			}}
			onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
		>
			<PressableScale
				onPress={leftAction.onPress}
				style={[
					{
						backgroundColor: leftAction.backgroundColor,
					},
					rLeftButtonStyle,
					styles.button,
				]}
			>
				<Animated.Text
					layout={
						leftAction.iconVisible
							? LayoutTransitionDefault
							: undefined
					}
					numberOfLines={1}
					style={[
						styles.label,
						rLeftTextStyle,
						{
							color: leftAction.labelColor,
						},
					]}
				>
					{leftAction.iconVisible && leftAction.icon}
					{leftAction.label}
				</Animated.Text>
			</PressableScale>
			<PressableScale
				onPress={splitted ? rightAction.onPress : mainAction.onPress}
				style={[rMainButtonStyle, styles.button]}
			>
				<Animated.Text
					layout={
						mainAction.iconVisible
							? LayoutTransitionDefault
							: undefined
					}
					style={[
						styles.label,
						rMainTextStyle,
						{
							color: mainAction.labelColor,
						},
					]}
				>
					{mainAction.iconVisible && mainAction.icon}
					{mainAction.label}
				</Animated.Text>
				<Animated.Text
					layout={
						rightAction.iconVisible
							? LayoutTransitionDefault
							: undefined
					}
					style={[
						styles.label,
						rRightTextStyle,
						{
							color: rightAction.labelColor,
						},
					]}
				>
					{rightAction.iconVisible && rightAction.icon}
					{rightAction.label}
				</Animated.Text>
			</PressableScale>
		</View>
	);
};

const styles = StyleSheet.create({
	label: {
		fontSize: 18,
		color: 'white',
		position: 'absolute',
		overflow: 'visible',
		letterSpacing: 0,
		fontFamily: 'InstrumentSans_600SemiBold',
	},
	button: {
		height: ButtonHeight,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: ButtonHeight,
		borderCurve: 'continuous',
		flexDirection: 'row',
	},
});
