import React from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

type PingerProps = {
  color?: string;
  size?: number;
  duration?: number;
};

export const Pinger: React.FC<PingerProps> = ({
  color = "#00ff7a",
  size = 10,
  duration = 3000,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    // loop the scale and opacity
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }) // reset
      ),
      -1 // infinite
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: duration, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 }) // reset
      ),
      -1
    );
  }, [scale, opacity]);

  const pingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size * 3,
            height: size * 3,
            borderRadius: (size * 3) / 2, // half of width/height
            backgroundColor: color,
          },
          pingStyle,
        ]}
      />
    </View>
  );
};
