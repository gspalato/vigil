import {
  Entypo,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import {
  GlassContainer,
  GlassView as ExpoGlassView,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { Pressable, View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Link, Redirect, router } from "expo-router";
import { GlassView } from "./GlassView";
import React from "react";

type HomeNavbarProps = {
  disableLiquidGlass?: boolean;
};

export const HomeNavbar: React.FC<HomeNavbarProps> = (props) => {
  const { disableLiquidGlass = false } = props;

  return isLiquidGlassAvailable() && !disableLiquidGlass ? (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        marginHorizontal: "auto",
      }}
    >
      <GlassContainer style={[styles.toolbar, { gap: 0 }]} spacing={50}>
        <ExpoGlassView
          style={[styles.toolbar, { width: 50 }]}
          tintColor="systemChromeMaterialLight"
          isInteractive
        >
          <Pressable
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(() =>
                router.push("/(home)/settings")
              )
            }
            style={styles.toolbarButton}
          >
            <FontAwesome5 name="user-alt" size={18} color="#000c" />
          </Pressable>
        </ExpoGlassView>
        <ExpoGlassView
          style={[styles.toolbar, { width: 50 }]}
          tintColor="systemChromeMaterialLight"
          isInteractive
        >
          <Pressable
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(() =>
                router.push("/(home)/history")
              )
            }
            style={styles.toolbarButton}
          >
            <FontAwesome6 name="list-ul" size={20} color="#000c" />
          </Pressable>
        </ExpoGlassView>
      </GlassContainer>
      <Pressable
        onPress={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(() =>
            router.push("/(home)/report")
          )
        }
      >
        <ExpoGlassView
          style={[styles.toolbar, { width: 50 }]}
          tintColor="#ffffffaa"
          isInteractive
        >
          <FontAwesome6 name="plus" size={24} color="#000c" />
        </ExpoGlassView>
      </Pressable>
    </View>
  ) : (
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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(() =>
              router.push("/(home)/settings")
            )
          }
          style={styles.toolbarButton}
        >
          <FontAwesome5 name="user-alt" size={18} color="#000c" />
        </Pressable>
        <Pressable
          onPress={() =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(() =>
              router.push("/(home)/report")
            )
          }
          style={styles.toolbarButton}
        >
          <Ionicons name="medical" size={24} color="#000c" />
        </Pressable>
      </GlassView>
      <Pressable
        onPress={() =>
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).then(() =>
            router.push("/(home)/report")
          )
        }
      >
        <GlassView
          style={[styles.toolbar, { width: 50 }]}
          tint="systemChromeMaterialLight"
          isInteractive
        >
          <FontAwesome6 name="plus" size={24} color="#000c" />
        </GlassView>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
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
