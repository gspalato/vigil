import { Dimensions, PixelRatio, Platform } from "react-native";

export function getApproximateScreenCornerRadius() {
  const { width, height } = Dimensions.get("window");
  const scale = PixelRatio.get();

  // Use the smaller dimension (in dp/points)
  const minDim = Math.min(width, height);

  let factor = 0.08; // default heuristic (8% of width)

  if (Platform.OS === "ios") {
    // iOS devices tend to have slightly rounder corners
    factor = 0.09;
  } else if (Platform.OS === "android") {
    // Android OEMs vary, stay conservative
    factor = 0.07;
  }

  // Corner radius in dp/points
  const radiusDp = minDim * factor;

  // Convert to pixels if needed
  const radiusPx = radiusDp * scale;

  return {
    dp: Math.round(radiusDp),
    px: Math.round(radiusPx),
  };
}

// useGoogleMapIosPerfFix.ios.ts
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from "react-native-reanimated"

/**
 * Fix Google Maps dragging/panning not smooth on iOS
 * @see https://github.com/react-native-maps/react-native-maps/issues/4937#issuecomment-2393609394
 */
export const useGoogleMapIosPerfFix = () => {
  const xPosition = useSharedValue(0)

  // Why it works
  // React native reanimated, force the ui tread to update, and force an higher frame rate
  useDerivedValue(() => {
    xPosition.value = 0
    xPosition.value = withRepeat(
      withTiming(100, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
    )
  }, [])
}
