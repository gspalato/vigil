import { BlurView, BlurViewProps } from 'expo-blur';
import {
	GlassView as ExpoGlassView,
	isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { ComponentProps } from 'react';

import { useAppTheme } from '@lib/Theme';

type GlassViewProps = ComponentProps<typeof ExpoGlassView> &
	ComponentProps<typeof BlurView>;

export const GlassView = (props: GlassViewProps) => {
	const { theme, themeName } = useAppTheme();

	return isLiquidGlassAvailable() ? (
		<ExpoGlassView
			tintColor={theme.colors.surface + 'aa'}
			{...props}
			isInteractive
		/>
	) : (
		<BlurView {...props} style={[props.style, { overflow: 'hidden' }]} />
	);
};
