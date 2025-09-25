import { KeyboardAvoidingView, Platform, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from "react-native-keyboard-controller";
import { createVideoPlayer, VideoView } from "expo-video";

import { Button, TextField } from "heroui-native";

import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "../../components/ThemedText";
import { useApi } from "../../lib/api";
import { useState } from "react";

// Create a singleton video player for the AI blob.
// This ensures that the video continues playing seamlessly across re-renders.
const AiBlobAssetId = require("../../assets/ai_blob_masked.mp4");
const AiBlobVideoPlayer = createVideoPlayer(AiBlobAssetId);
AiBlobVideoPlayer.loop = true;
AiBlobVideoPlayer.muted = true;
AiBlobVideoPlayer.play();

export default function Page() {
  const { reportSymptoms } = useApi();

  const [text, setText] = useState("");

  const onAnalyze = async () => {
    if (text.trim().length === 0) {
      return;
    }

    try {
      const res = await reportSymptoms(text);
      console.log(res);
    } catch (error) {
      console.error("Error reporting symptoms:", error);
    }
  };

  return (
    <>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          //behavior={Platform.OS === "ios" ? "padding" : undefined}
          contentContainerStyle={{
            flex: 1,
            justifyContent: "flex-start",
            alignItems: "center",
            padding: 20,
            paddingBottom: 0,
            flexDirection: "column",
            gap: 20,
          }}
        >
          <StatusBar barStyle={"dark-content"} />
          <View
            style={{
              width: "100%",
              gap: 3,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <VideoView
              style={{ height: 50, width: 50 }}
              player={AiBlobVideoPlayer}
              fullscreenOptions={{ enable: false }}
              allowsPictureInPicture={false}
              allowsVideoFrameAnalysis={false}
              nativeControls={false}
              shouldRasterizeIOS
            />
            <ThemedText type="title" size="xl">
              How are you feeling today?
            </ThemedText>
          </View>
          <TextField isRequired style={{ width: "100%" }}>
            <TextField.Input
              placeholder="Describe your symptoms, you can define their intensity as well."
              multiline
              style={{ fontFamily: "InstrumentSans_400Regular" }}
              onChangeText={setText}
            />
          </TextField>
          <View
            style={{
              width: "100%",
              gap: 10,
              flexDirection: "row",
              marginTop: "auto",
            }}
          >
            <Button
              variant="primary"
              size="md"
              style={{
                borderRadius: 50,
                flex: 1,
              }}
              onPress={() => router.back()}
            >
              <Button.StartContent>
                <Ionicons name="chevron-back" size={18} color={"#fff"} />
              </Button.StartContent>
              <Button.LabelContent>
                <ThemedText
                  style={{ fontSize: 15, color: "#fff" }}
                  type="button"
                >
                  Back
                </ThemedText>
              </Button.LabelContent>
            </Button>
            <Button
              variant="primary"
              size="md"
              style={{
                borderRadius: 50,
                flex: 1,
              }}
              onPress={onAnalyze}
            >
              <Button.LabelContent>
                <ThemedText
                  style={{ fontSize: 15, color: "#fff" }}
                  type="button"
                >
                  Analyze
                </ThemedText>
              </Button.LabelContent>
              <Button.EndContent>
                <Ionicons name="chevron-forward" size={18} color={"#fff"} />
              </Button.EndContent>
            </Button>
          </View>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </>
  );
}
