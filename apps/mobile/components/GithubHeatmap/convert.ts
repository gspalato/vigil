import { addDays, format, parseISO } from 'date-fns';

import { ContributionData, Report } from './types';

/**
 * Aggregates symptom severity into a contribution-like score per day.
 * @param reports List of reports with symptoms and dates
 * @param days Number of days to include
 * @param endDate Last date of the range (default: today)
 */
export const generateContributionFromReports = ({
	reports,
	days,
	endDate = new Date(),
}: {
	reports: Report[];
	days: number;
	endDate?: Date;
}): ContributionData => {
	const startDate = addDays(endDate, -days + 1);
	const data: ContributionData = {};

	// Initialize all dates with 0
	for (let i = 0; i < days; i++) {
		const dateStr = format(addDays(startDate, i), 'yyyy-MM-dd');
		data[dateStr] = 0;
	}

	// Aggregate symptom severity into contribution levels
	reports.forEach((report) => {
		const dateStr = format(new Date(report.timestamp), 'yyyy-MM-dd');
		if (dateStr in data) {
			// Example: sum of all symptom severities
			const totalSeverity = Object.values(report.symptoms).reduce(
				(sum, severity) => sum + severity,
				0,
			);
			data[dateStr] += totalSeverity;
		}
	});

	console.log('Generated contribution data:', data);

	return data;
};
