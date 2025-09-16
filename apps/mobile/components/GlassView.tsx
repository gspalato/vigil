import { BlurView, BlurViewProps } from "expo-blur";
import {
  GlassView as ExpoGlassView,
  isLiquidGlassAvailable,
} from "expo-glass-effect";

export const GlassView = isLiquidGlassAvailable()
  ? ExpoGlassView
  : (props: BlurViewProps) => (
      <BlurView {...props} style={[props.style, { overflow: "hidden" }]} />
    );
