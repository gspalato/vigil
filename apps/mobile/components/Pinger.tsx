import React, { useRef, useEffect } from "react";
import { Animated, Easing, View } from "react-native";

type PingerProps = {
  color?: string;
  size?: number;
};

export const Pinger: React.FC<PingerProps> = ({
  color = "#00ff7a",
  size = 10,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, opacityAnim]);

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
        style={{
          position: "absolute",
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          borderWidth: 2,
          borderColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      />
    </View>
  );
};
