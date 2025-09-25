import React, { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Pinger } from "./Pinger";
import { ThemedText } from "./ThemedText";

type HomeHeaderProps = {
  alertCount?: number;
};

export const HomeHeader: React.FC<HomeHeaderProps> = (props) => {
  const { alertCount = 0 } = props;

  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View
      id="header"
      style={[styles.container, { paddingTop: safeAreaInsets.top }]}
    >
      <Text style={styles.appName}>Vigil</Text>
      <View
        id="right-side-menu"
        style={{
          paddingRight: 5,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <Pinger size={7} color="#00ff7a" />
        <ThemedText size="sm" type="body" style={{ color: "#fff" }}>
          {alertCount === 0 ? "No" : String(alertCount)} alert
          {alertCount === 1 ? "" : "s"} nearby.
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 15,
    minHeight: 48,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#000000",
    paddingBottom: 10,
  },
  appName: {
    //position: 'absolute',
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 48,
    //textShadowColor: "#00000066",
    //textShadowOffset: {
    //  width: 0,
    //  height: 0,
    //},
    //textShadowRadius: 10,
    paddingLeft: 5,
    paddingRight: 5,
  },
});
