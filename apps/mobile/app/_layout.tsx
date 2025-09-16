import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import React, { useEffect } from "react";
import { ClerkProvider } from "@clerk/clerk-expo";
import { HeroUINativeProvider } from "heroui-native";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  Unbounded_800ExtraBold,
  Unbounded_900Black,
} from "@expo-google-fonts/unbounded";

import "../global.css";

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
      <HeroUINativeProvider>
        <KeyboardProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </KeyboardProvider>
      </HeroUINativeProvider>
    </ClerkProvider>
  );
}
