import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import React, { useEffect } from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';

import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter'
import { Unbounded_800ExtraBold, Unbounded_900Black } from '@expo-google-fonts/unbounded'

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Unbounded_800ExtraBold,
    Unbounded_900Black
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
      <Stack screenOptions={{
        headerShown: false
      }}/>
    </ClerkProvider>
  );
}
