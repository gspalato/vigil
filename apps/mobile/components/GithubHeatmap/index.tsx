import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, ViewProps } from 'react-native';

import { ThemedView } from '@components/ThemedView';

import { GitHubContributionCalendar } from './Calendar';
import { COLOR_SCHEMES } from './colorScheme';
import { generateContributionFromReports } from './convert';
import { CalendarAnimationControls, ContributionData, Report } from './types';

type GitHubHeatmapProps = {
	reports: Report[];
} & ViewProps;

export const GitHubHeatmap = ({
	reports,
	...viewProps
}: GitHubHeatmapProps) => {
	const calendarRef = useRef<CalendarAnimationControls>(null);

	const [currentWidth, setCurrentWidth] = useState(0);

	const contributionData = useMemo(() => {
		// this calculation should require a bit more love, but it's a start 😅
		return generateContributionFromReports({
			reports: reports,
			days: Math.floor(currentWidth / 3),
		});
	}, [currentWidth, reports]);

	useEffect(() => {
		handleToggleAnimation();
	}, [contributionData]);

	const handleToggleAnimation = () => {
		calendarRef.current?.toggleAnimation();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	return (
		<View
			{...viewProps}
			style={styles.appContainer}
			onTouchStart={handleToggleAnimation}
			onLayout={(e) => setCurrentWidth(e.nativeEvent.layout.width)}
		>
			<GitHubContributionCalendar
				ref={calendarRef}
				data={contributionData}
				colorScheme={COLOR_SCHEMES.blue}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	appContainer: {
		flex: 1,
		backgroundColor: 'transparent',
		justifyContent: 'center',
		alignItems: 'center',
	},
});
