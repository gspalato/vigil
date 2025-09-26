import { ClerkProvider } from "@clerk/clerk-expo";
import { VigilAPIProvider } from "../lib/api";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GLTransitionsProvider } from "../transitions";
import { DirectionalWarp } from "../transitions/shaders/DirectionalWarp";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

import RootLayout from "./_layout";

export default function App() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <VigilAPIProvider>
        <HeroUINativeProvider>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <GLTransitionsProvider transition={DirectionalWarp}>
                <RootLayout />
              </GLTransitionsProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </HeroUINativeProvider>
      </VigilAPIProvider>
    </ClerkProvider>
  );
}
