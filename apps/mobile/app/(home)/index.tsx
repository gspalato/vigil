import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, Redirect, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import MapView, { Heatmap, PROVIDER_GOOGLE, Region } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { FontAwesome6, FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { GlassView } from "../../components/GlassView";
import { ThemedText } from "../../components/ThemedText";
import { Pinger } from "../../components/Pinger";
import { HomeNavbar } from "../../components/HomeNavbar";
import { HomeHeader } from "../../components/HomeHeader";
import {
  getApproximateScreenCornerRadius,
  useGoogleMapIosPerfFix,
} from "../../lib/utils";
import {
  Easing,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useApi } from "../../lib/api";

export default function Page() {
  const { user } = useUser();

  const [alertCount, setAlertCount] = useState<number>(0);

  const { heatmapPoints, fetchHeatmapPoints } = useApi();
  useEffect(() => {
    fetchHeatmapPoints({ timespan: "MONTH" });
  }, []);

  useGoogleMapIosPerfFix();
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Set initial region for the map
      setInitialRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01, // zoom level (small delta = closer)
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  return (
    <>
      <SignedIn>
        <StatusBar style="light" />
        <View style={styles.container}>
          <HomeHeader alertCount={alertCount} />
          <MapView
            provider={PROVIDER_GOOGLE}
            googleMapId="d6f5630a06421fd44ad483f1"
            style={styles.map}
            //userInterfaceStyle="dark"
            initialRegion={initialRegion ?? undefined}
            region={initialRegion ?? undefined}
            showsUserLocation
            followsUserLocation
            onPanDrag={() => {}} // Fix for low framerate when interacting with the map on iOS.
          >
            <Heatmap points={heatmapPoints as any} />
          </MapView>
        </View>
        <MaskedView
          style={{
            position: "absolute",
            width: "100%",
            height: 140,
            pointerEvents: "none",
            opacity: 0,
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
            justifyContent: "flex-end",
            pointerEvents: "box-none",
          }}
        >
          <HomeNavbar />
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
    backgroundColor: "#000000",
  },
  map: {
    width: "100%",
    height: "108%",
    borderTopLeftRadius: getApproximateScreenCornerRadius().dp,
    borderTopRightRadius: getApproximateScreenCornerRadius().dp,
    overflow: "hidden",
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
