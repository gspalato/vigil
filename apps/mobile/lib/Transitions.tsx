import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useEffect } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export function useTransitionProgress() {
	const navigation = useNavigation<any>();
	const progress = useSharedValue(0);

	useEffect(() => {
		const unsubscribeStart = navigation.addListener(
			'transitionStart',
			(e: any) => {
				const isClosing = e.data?.closing ?? false;
				progress.value = withTiming(isClosing ? 0 : 1, {
					duration: 300,
				});
			},
		);

		const unsubscribeEnd = navigation.addListener('transitionEnd', () => {
			// Optional: reset progress after transition
			// progress.value = 0;
		});

		return () => {
			unsubscribeStart();
			unsubscribeEnd();
		};
	}, [navigation, progress]);

	return progress;
}
