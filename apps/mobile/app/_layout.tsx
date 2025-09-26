import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import {
	InstrumentSans_400Regular,
	InstrumentSans_500Medium,
	InstrumentSans_600SemiBold,
	InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import {
	Inter_400Regular,
	Inter_500Medium,
	Inter_600SemiBold,
	Inter_700Bold,
	Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
	Unbounded_800ExtraBold,
	Unbounded_900Black,
} from '@expo-google-fonts/unbounded';
import { useFonts } from 'expo-font';
import { Slot, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { VigilAPIContextType, VigilAPIProvider } from '@lib/api';

import { InferSymptomsAndCauseResponse } from '@/lib/generated/api';

import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded] = useFonts({
		InstrumentSerif_400Regular,
		InstrumentSans_400Regular,
		InstrumentSans_500Medium,
		InstrumentSans_600SemiBold,
		InstrumentSans_700Bold,
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
		Inter_800ExtraBold,
		Unbounded_800ExtraBold,
		Unbounded_900Black,
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hide();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<ClerkProvider tokenCache={tokenCache}>
			<VigilAPIProvider>
				<HeroUINativeProvider>
					<GestureHandlerRootView>
						<KeyboardProvider>
							<Stack screenOptions={{ headerShown: false }} />
						</KeyboardProvider>
					</GestureHandlerRootView>
				</HeroUINativeProvider>
			</VigilAPIProvider>
		</ClerkProvider>
	);
}
