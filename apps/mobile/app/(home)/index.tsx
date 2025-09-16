import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, Redirect, router } from "expo-router";
import React, { useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { FontAwesome6, FontAwesome5, Ionicons } from "@expo/vector-icons";

import { GlassView } from "../../components/GlassView";
import { ThemedText } from "../../components/ThemedText";
import { Pinger } from "../../components/Pinger";

export default function Page() {
  const { user } = useUser();

  const [alertCount, setAlertCount] = useState<number>(0);

  return (
    <>
      <SignedIn>
        <StatusBar style="light" />
        <View style={styles.container}>
          <MapView
            style={styles.map}
            //userInterfaceStyle="dark"
            showsUserLocation
            followsUserLocation
          ></MapView>
        </View>
        <MaskedView
          style={{
            position: "absolute",
            width: "100%",
            height: 140,
            pointerEvents: "none",
          }}
          maskElement={
            <LinearGradient
              colors={["rgba(0,0,0,.5)", "rgba(0,0,0,0)"]} // Adjust colors for desired blur transition
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={1000}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
        <SafeAreaView
          style={{
            position: "absolute",
            flex: 1,
            width: "100%",
            height: "100%",
            justifyContent: "space-between",
            pointerEvents: "box-none",
          }}
        >
          <View
            id="header"
            style={{
              width: "100%",
              paddingHorizontal: 15,
              minHeight: 48,
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "row",
            }}
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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              marginHorizontal: "auto",
            }}
          >
            <GlassView style={styles.toolbar} tint="systemChromeMaterialLight">
              <Pressable
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(
                    () => router.push("/(home)/settings")
                  )
                }
                style={styles.toolbarButton}
              >
                <FontAwesome5 name="user-alt" size={18} color="#000c" />
              </Pressable>
              <Pressable
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(
                    () => router.push("/(home)/report")
                  )
                }
                style={styles.toolbarButton}
              >
                <Ionicons name="medical" size={24} color="#000c" />
              </Pressable>
            </GlassView>
            <GlassView style={styles.toolbar} tint="systemChromeMaterialLight">
              <Pressable
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(
                    () => router.push("/(home)/report")
                  )
                }
                style={styles.toolbarButton}
              >
                <FontAwesome6 name="plus" size={24} color="#000c" />
              </Pressable>
            </GlassView>
          </View>
        </SafeAreaView>
      </SignedIn>
      <SignedOut>
        <Redirect href="/(auth)/sign-in" />
      </SignedOut>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "108%",
  },
  appName: {
    //position: 'absolute',
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 48,
    textShadowColor: "#00000066",
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 10,
    paddingLeft: 5,
    paddingRight: 5,
  },
  profileButton: {
    height: 35,
    width: 35,
    borderRadius: 10,
    borderColor: "#ffffff",
    borderWidth: 2.5,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  toolbarContainer: {
    position: "absolute",
    top: 200,
    left: 50,
    width: 250,
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toolbar: {
    height: 50,
    width: "auto",
    borderRadius: 50,
    //marginHorizontal: "auto",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    flexDirection: "row",
  },
  toolbarButton: {
    height: 35,
    width: 35,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
});
