// Create a singleton video player for the AI blob.

import { createVideoPlayer, VideoView } from "expo-video";
import React, { ComponentProps, forwardRef } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

// This ensures that the video continues playing seamlessly across re-renders.
const AiBlobAssetId = require("../assets/ai_blob_masked.mp4");
const AiBlobVideoPlayer = createVideoPlayer(AiBlobAssetId);
AiBlobVideoPlayer.loop = true;
AiBlobVideoPlayer.muted = true;
AiBlobVideoPlayer.play();

type AiBlobProps = {
  style?: ComponentProps<typeof VideoView>["style"];
};

export const AiBlob = Animated.createAnimatedComponent(
  forwardRef((props: AiBlobProps, ref: React.Ref<VideoView>) => {
    const { style } = props;

    return (
      <VideoView
        ref={ref}
        style={[
          {
            height: 50,
            width: 50,
            borderRadius: 50,
          },
          style,
        ]}
        player={AiBlobVideoPlayer}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        allowsVideoFrameAnalysis={false}
        nativeControls={false}
        shouldRasterizeIOS
      />
    );
  })
);
