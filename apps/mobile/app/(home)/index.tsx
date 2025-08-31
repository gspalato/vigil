import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, Redirect, router } from "expo-router";
import React from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";

export default function Page() {
  const { user } = useUser();

  return (
    <>
      <SignedIn>
        <StatusBar style="light" />
        <View style={styles.container}>
          <MapView style={styles.map} showsUserLocation followsUserLocation />
        </View>
        <MaskedView
          style={{
            position: "absolute",
            width: "100%",
            height: "20%",
            pointerEvents: "none",
          }}
          maskElement={
            <LinearGradient
              colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]} // Adjust colors for desired blur transition
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={100}
            tint="systemThinMaterialDark"
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
        <SafeAreaView
          style={{ position: "absolute", flex: 1, width: "100%", height: 70 }}
        >
          <View
            id="header"
            style={{
              width: "100%",
              paddingHorizontal: 15,
              height: 40,
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "row",
            }}
          >
            <Text style={styles.appName}>VIGIL</Text>
            <View id="right-side-menu" style={{ paddingRight: 5 }}>
              <Pressable
                onPress={() => router.push("/(home)/settings")}
                style={(pressed) => ({ opacity: pressed ? 1 : 0.5 })}
              >
                <Image
                  source={user?.imageUrl}
                  transition={500}
                  style={styles.profileButton}
                />
              </Pressable>
            </View>
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
    height: "100%",
  },
  appName: {
    //position: 'absolute',
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "Unbounded_900Black",
    fontSize: 32,
    textShadowColor: "#00000066",
    textShadowOffset: {
      width: 0,
      height: 0,
    },
    textShadowRadius: 5,
    paddingLeft: 5,
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
});
