import React, { ComponentProps } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

type ThemedViewProps = {
  thinBorder?: boolean;
  elevation?: "background" | "surface" | "raised" | "overlay";
} & ComponentProps<typeof View>;

export const ThemedView: React.FC<ThemedViewProps> = (props) => {
  const { children, style, thinBorder, elevation } = props;

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: elevation === "background" ? "#f2f2f2" : "#fff",
          borderColor: "#eee",
          borderWidth: thinBorder ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
