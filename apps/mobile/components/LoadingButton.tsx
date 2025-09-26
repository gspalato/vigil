import Color from 'color';
import { MotiView } from 'moti';
import { PressableScale } from 'pressto';
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import Animated, {
	FadeIn,
	FadeOut,
	LinearTransition,
} from 'react-native-reanimated';

import { ActivityIndicator, type ActivityStatus } from './ActivityIndicator';

type LoadingButtonProps = {
	onPress?: () => Promise<void>;
	style?: StyleProp<ViewStyle>;
	status: ActivityStatus;
	colorFromStatusMap: Record<ActivityStatus, string>;
	titleFromStatusMap?: Record<ActivityStatus, string>;
};

const LoadingButton: React.FC<LoadingButtonProps> = ({
	onPress,
	style,
	status,
	colorFromStatusMap,
	titleFromStatusMap,
}) => {
	const activeColor = useMemo(() => {
		return colorFromStatusMap[status] || colorFromStatusMap.idle;
	}, [colorFromStatusMap, status]);

	return (
		<PressableScale onPress={onPress}>
			<MotiView
				transition={{
					backgroundColor: {
						type: 'timing',
						duration: 1000,
					},
				}}
				style={[
					{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 12,
					},
					style,
				]}
				animate={{
					backgroundColor: Color(activeColor).lighten(0.6).hex(),
				}}
			>
				<ActivityIndicator status={status} color={activeColor} />
				<Animated.Text
					key={`text`}
					entering={FadeIn}
					exiting={FadeOut}
					style={[
						styles.title,
						{
							color: activeColor,
						},
					]}
				>
					{titleFromStatusMap?.[status] || ''}
				</Animated.Text>
			</MotiView>
		</PressableScale>
	);
};

const styles = StyleSheet.create({
	title: {
		fontWeight: 'bold',
		fontSize: 14,
	},
});

export { LoadingButton };
