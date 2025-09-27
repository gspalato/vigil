import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
	createAnimatedComponent,
	interpolate,
	useAnimatedStyle,
} from 'react-native-reanimated';

import { BackSide } from '@/components/MembershipTicket/BackSide';
import { FrontSide } from '@/components/MembershipTicket/FrontSide';
import { Ticket } from '@/components/Ticket';

import { useTransitionProgress } from '@/lib/Transitions';

const AnimatedPressable = createAnimatedComponent(Pressable);

export default function Modal() {
	const { user } = useUser();
	const progress = useTransitionProgress();

	const ticketNumber = hashTo8Digits(user?.fullName ?? 'unknown');

	const animatedBackgroundStyle = useAnimatedStyle(() => {
		return {
			opacity: interpolate(progress.value, [0, 1], [0, 1]),
		};
	});

	return (
		<Animated.View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 1000,
			}}
		>
			<Animated.View
				style={[
					StyleSheet.absoluteFill,
					{ backgroundColor: '#00000088' },
					animatedBackgroundStyle,
				]}
			>
				<Pressable
					style={StyleSheet.absoluteFill}
					onPress={() => router.back()}
				/>
			</Animated.View>
			<Animated.View
				style={{
					position: 'absolute',
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<Ticket
					width={300}
					height={400}
					frontSide={
						<FrontSide
							username={'@' + user?.username}
							ticketNumber={`#${ticketNumber}`}
						/>
					}
					backSide={<BackSide />}
				/>
			</Animated.View>
		</Animated.View>
	);
}

function hashTo8Digits(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // keep it unsigned
	}
	const num = hash % 100_000_000; // ensures 8 digits max
	return String(num).padStart(8, '0'); // pad with leading zeros
}
