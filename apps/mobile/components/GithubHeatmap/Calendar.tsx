import { eachDayOfInterval, endOfWeek, format, startOfWeek } from 'date-fns';
import React, {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { ThemedView } from '@components/ThemedView';

import { ColorScheme, DEFAULT_COLOR_SCHEME } from './colorScheme';
import { ContributionSquare, SquareAnimationControls } from './Square';
import {
	CalendarAnimationControls,
	ContributionData,
	ContributionLevel,
} from './types';
import { generateDayLabels, groupDaysIntoWeeks } from './utils/dateUtils';

const dayLabels = generateDayLabels();

export type GitHubContributionCalendarProps = {
	data: ContributionData;
	colorScheme?: ColorScheme;
};

export const GitHubContributionCalendar = forwardRef<
	CalendarAnimationControls,
	GitHubContributionCalendarProps
>(({ data, colorScheme = DEFAULT_COLOR_SCHEME }, ref) => {
	const squareRefs = useRef<(SquareAnimationControls | null)[]>([]);
	const isAnimating = useSharedValue(false);

	// Calculate date range from data
	const { startDate, endDate } = useMemo(() => {
		const dates = Object.keys(data)
			.map((dateStr) => {
				const [year, month, day] = dateStr.split('-').map(Number);
				return new Date(year, month - 1, day);
			})
			.sort((a, b) => a.getTime() - b.getTime());
		return {
			startDate: dates[0],
			endDate: dates[dates.length - 1],
		};
	}, [data]);

	// Normalize levels based on minimum and maximum values in data.
	const minLevel = Math.min(...Object.values(data).filter((v) => v > 0));
	const maxLevel = Math.max(...Object.values(data));
	Object.keys(data).forEach((date) => {
		const value = data[date];
		if (value === 0) {
			data[date] = 0 as ContributionLevel;
		} else if (value === maxLevel) {
			data[date] = 4 as ContributionLevel;
		} else {
			// Scale between 1 and 3
			const scaledLevel = Math.ceil(
				((value - minLevel) / (maxLevel - minLevel)) * 3,
			);
			data[date] = Math.min(
				Math.max(scaledLevel, 1),
				3,
			) as ContributionLevel;
		}
	});

	// Generate day labels

	// Calculate calendar grid
	const weeks = useMemo(() => {
		const calendarStart = startOfWeek(startDate, { weekStartsOn: 1 });
		const calendarEnd = endOfWeek(endDate, { weekStartsOn: 1 });

		const allCalendarDays = eachDayOfInterval({
			start: calendarStart,
			end: calendarEnd,
		});

		return groupDaysIntoWeeks(allCalendarDays);
	}, [startDate, endDate]);

	// Pre-calculate square indices for valid dates
	const squareIndexMap = useMemo(() => {
		const indexMap = new Map<string, number>();
		let squareIndex = 0;

		weeks.forEach((week, weekIndex) => {
			week.forEach((date, dayIndex) => {
				const isInDataRange = date >= startDate && date <= endDate;
				if (isInDataRange) {
					const key = `${weekIndex}-${dayIndex}`;
					indexMap.set(key, squareIndex);
					squareIndex++;
				}
			});
		});

		return indexMap;
	}, [weeks, startDate, endDate]);

	const startAnimation = useCallback(() => {
		isAnimating.value = true;
		squareRefs.current.forEach((squareRef) => {
			squareRef?.startAnimation();
		});
	}, [isAnimating]);

	const resetAnimation = useCallback(() => {
		isAnimating.value = false;
		squareRefs.current.forEach((squareRef) => {
			squareRef?.resetAnimation();
		});
	}, [isAnimating]);

	const toggleAnimation = useCallback(() => {
		if (isAnimating.value) {
			return resetAnimation();
		}
		return startAnimation();
	}, [startAnimation, resetAnimation, isAnimating]);

	// Animation controls
	useImperativeHandle(
		ref,
		() => ({
			startAnimation: startAnimation,
			resetAnimation: resetAnimation,
			toggleAnimation: toggleAnimation,
		}),
		[startAnimation, resetAnimation, toggleAnimation],
	);

	return (
		<ThemedView
			elevation='surface'
			style={styles.calendarContainer}
			thinBorder
		>
			<View style={styles.calendarGrid}>
				{/* Day labels */}
				<View style={styles.dayLabelsContainer}>
					{dayLabels.map((day) => (
						<Text key={day} style={styles.dayLabel}>
							{day}
						</Text>
					))}
				</View>

				{/* Contribution grid */}
				<View style={styles.gridContainer}>
					{weeks.map((week, weekIndex) => (
						<View key={weekIndex} style={styles.week}>
							{week.map((date, dayIndex) => {
								const dateStr = format(date, 'yyyy-MM-dd');
								const level = data[dateStr] || 0;

								// Check if this date is within our actual data range
								const isInDataRange =
									date >= startDate && date <= endDate;

								// If outside data range, show empty square
								if (!isInDataRange) {
									return (
										<View
											key={`empty-${weekIndex}-${dayIndex}`}
											style={[
												styles.square,
												styles.emptySquare,
											]}
										/>
									);
								}

								const squareIndex = squareIndexMap.get(
									`${weekIndex}-${dayIndex}`,
								)!;
								return (
									<ContributionSquare
										key={`${weekIndex}-${dayIndex}`}
										ref={(el) => {
											squareRefs.current[squareIndex] =
												el;
										}}
										level={level as any}
										weekIndex={weekIndex}
										dayIndex={dayIndex}
										colorScheme={colorScheme}
									/>
								);
							})}
						</View>
					))}
				</View>
			</View>
		</ThemedView>
	);
});

const styles = StyleSheet.create({
	calendarContainer: {
		padding: 16,
		borderRadius: 16,
		borderCurve: 'continuous',
		boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.05)',
	},
	calendarGrid: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	dayLabelsContainer: {
		marginRight: 8,
		justifyContent: 'flex-start',
	},
	dayLabel: {
		fontSize: 11,
		color: '#656d76',
		height: 14,
		textAlign: 'left',
		textAlignVertical: 'center',
		width: 25,
		marginBottom: 3,
		fontFamily: 'regular',
	},
	gridContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	week: {
		marginRight: 3,
	},
	square: {
		width: 14,
		height: 14,
		marginBottom: 3,
		borderRadius: 2,
	},
	emptySquare: {
		backgroundColor: 'transparent',
	},
});
