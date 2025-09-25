import { BlurView, BlurViewProps } from "expo-blur";
import {
  GlassView as ExpoGlassView,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { ComponentProps } from "react";

export const GlassView = isLiquidGlassAvailable()
  ? (props: ComponentProps<typeof ExpoGlassView>) => (
      <ExpoGlassView {...props} isInteractive />
    )
  : (props: BlurViewProps) => (
      <BlurView {...props} style={[props.style, { overflow: "hidden" }]} />
    );
