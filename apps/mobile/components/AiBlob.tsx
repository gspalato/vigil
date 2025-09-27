// Create a singleton video player for the AI blob.
import { createVideoPlayer, VideoView } from 'expo-video';
import React, { ComponentProps, forwardRef } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useAppTheme } from '@/lib/Theme';

// This ensures that the video continues playing seamlessly across re-renders.
const AiBlobLightAssetId = require('../assets/ai_blob_masked.mp4');
const AiBlobLightVideoPlayer = createVideoPlayer(AiBlobLightAssetId);
AiBlobLightVideoPlayer.loop = true;
AiBlobLightVideoPlayer.muted = true;
AiBlobLightVideoPlayer.play();

const AiBlobDarkAssetId = require('../assets/ai_blob.mp4');
const AiBlobDarkVideoPlayer = createVideoPlayer(AiBlobDarkAssetId);
AiBlobDarkVideoPlayer.loop = true;
AiBlobDarkVideoPlayer.muted = true;
AiBlobDarkVideoPlayer.play();

type AiBlobProps = {
	style?: ComponentProps<typeof VideoView>['style'];
};

export const AiBlob = Animated.createAnimatedComponent(
	forwardRef((props: AiBlobProps, ref: React.Ref<VideoView>) => {
		const { style } = props;

		const { themeName } = useAppTheme();

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
				player={
					themeName === 'dark'
						? AiBlobDarkVideoPlayer
						: AiBlobLightVideoPlayer
				}
				fullscreenOptions={{ enable: false }}
				allowsPictureInPicture={false}
				allowsVideoFrameAnalysis={false}
				nativeControls={false}
				shouldRasterizeIOS
			/>
		);
	}),
);
