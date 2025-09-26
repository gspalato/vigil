import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
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
import {
	createStaticNavigation,
	NavigationContainer,
	useNavigation,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import { Stack as ERStack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { VigilAPIProvider } from '@lib/api';

import AuthStack from './(auth)/_layout';
import HistoryScreen from './(home)/history';
import HomeScreen from './(home)/index';
import ReportScreen from './(home)/report';
import ReportResultScreen from './(home)/report_result';
import ReportThinkingScreen from './(home)/report_thinking';
import SettingsScreen from './(home)/settings';
import { GLTransitionsProvider } from '@/transitions';
import { DirectionalWarp } from '@/transitions/shaders/DirectionalWarp';

import '../global.css';

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator({
	initialRouteName: 'auth',
	screenOptions: {
		headerShown: false,
		contentStyle: { backgroundColor: '#000000' },
	},
	screens: {
		home: {
			screen: HomeScreen,
		},
		report: {
			screen: ReportScreen,
		},
		report_thinking: {
			screen: ReportThinkingScreen,
			presentation: 'modal',
		},
		report_result: {
			screen: ReportResultScreen,
		},
		history: {
			screen: HistoryScreen,
		},
		settings: {
			screen: SettingsScreen,
		},
		auth: {
			screen: AuthStack,
		},
	},
});

const Navigation = createStaticNavigation(Stack);

export default function RootLayout() {
	const { isSignedIn } = useAuth();

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

	/* Expo Router */
	/*
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <VigilAPIProvider>
        <HeroUINativeProvider>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <GLTransitionsProvider transition={DirectionalWarp}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#000000" },
                  }}
                />
              </GLTransitionsProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </HeroUINativeProvider>
      </VigilAPIProvider>
    </ClerkProvider>
  );
  */

	return <Navigation />;
}
