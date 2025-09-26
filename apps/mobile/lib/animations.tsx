import { Keyframe } from 'react-native-reanimated';

// Instead of using Entering and Exiting Layout Animations, we can use Keyframes!
// I created a detailed tutorial about it at https://www.reanimate.dev
export const ScaleOpacityKeyframe = {
	from: {
		opacity: 0,
		transform: [{ scale: 0 }],
	},
	to: {
		opacity: 1,
		transform: [{ scale: 1 }],
	},
};

export const ScaleIconEnteringKeyframe = new Keyframe(
	ScaleOpacityKeyframe,
).duration(250);

export const ScaleIconExitingKeyframe = new Keyframe({
	from: ScaleOpacityKeyframe.to,
	to: ScaleOpacityKeyframe.from,
}).duration(200);
