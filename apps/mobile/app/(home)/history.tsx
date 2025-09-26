import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import {
	Pressable,
	ScrollView,
	StatusBar,
	StyleSheet,
	View,
} from 'react-native';

import { PageHeader } from '@components/PageHeader';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';

import { useApi } from '@lib/api';
import {
	capitalizeFirstLetter,
	getApproximateScreenCornerRadius,
} from '@lib/utils';

import { Palette } from '@/lib/palette';

const ExampleReports = [
	{
		id: '1',
		summary: 'Fever, cough, and fatigue',
		date: '2024-06-15',
	},
	{
		id: '2',
		summary: 'Headache and sore throat',
		date: '2024-06-10',
	},
	{
		id: '3',
		summary: 'Mild chest pain',
		date: '2024-06-05',
	},
	{
		id: '4',
		summary: 'Shortness of breath',
		date: '2024-06-01',
	},
	{
		id: '5',
		summary: 'Nausea and vomiting',
		date: '2024-05-28',
	},
	{
		id: '6',
		summary: 'Dizziness and blurred vision',
		date: '2024-05-20',
	},
	{
		id: '7',
		summary: 'Abdominal pain',
		date: '2024-05-15',
	},
	{
		id: '8',
		summary: 'Joint pain and swelling',
		date: '2024-05-10',
	},
	{
		id: '9',
		summary: 'Skin rash and itching',
		date: '2024-05-05',
	},
	{
		id: '10',
		summary: 'Back pain and stiffness',
		date: '2024-05-01',
	},
];

export default function Page() {
	const borderRadius = getApproximateScreenCornerRadius();

	const { myReports, fetchMyReports } = useApi();

	useEffect(() => {
		fetchMyReports();
	}, []);

	const reports = useMemo(
		() => myReports.sort((a, b) => a.timestamp - b.timestamp),
		[myReports],
	);

	return (
		<>
			<StatusBar barStyle='dark-content' />
			<View style={styles.page}>
				<PageHeader title='History' />
				<View style={{ flex: 1, paddingHorizontal: 20 }}>
					<FlashList
						style={{ flex: 1 }}
						ListHeaderComponent={<View style={{ height: 20 }} />} // space at top
						ListFooterComponent={<View style={{ height: 20 }} />} // space at bottom
						data={reports}
						renderItem={({ item, index }) => (
							<View
								style={{
									padding: 15,
									paddingBottom:
										index === reports.length - 1 ? 25 : 15,

									borderBottomWidth: StyleSheet.hairlineWidth,
									borderBottomColor: Palette.border,
									gap: 3,
									backgroundColor: '#fff',

									borderTopLeftRadius:
										index === 0 ? borderRadius.dp / 2 : 0,
									borderTopRightRadius:
										index === 0 ? borderRadius.dp / 2 : 0,
									borderBottomLeftRadius:
										index === reports.length - 1
											? borderRadius.dp
											: 0,
									borderBottomRightRadius:
										index === reports.length - 1
											? borderRadius.dp
											: 0,

									borderColor: Palette.border,
									borderWidth: StyleSheet.hairlineWidth,
								}}
							>
								<ThemedText
									type='title'
									style={{
										fontSize: 20,
										fontWeight: 'bold',
									}}
								>
									{capitalizeFirstLetter(item.cause)}
								</ThemedText>
								<ThemedText
									style={{
										fontSize: 16,
										fontWeight: 'bold',
									}}
									numberOfLines={2}
									ellipsizeMode='tail'
								>
									{capitalizeFirstLetter(
										Object.keys(item.symptoms).join(', ') +
											'.',
									)}
								</ThemedText>
								<ThemedText
									style={{
										fontSize: 12,
										color: '#888',
										paddingTop: 3,
									}}
								>
									{new Date(
										item.timestamp,
									).toLocaleDateString()}
								</ThemedText>
							</View>
						)}
					/>
				</View>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	page: { flex: 1, backgroundColor: Palette.background },
	header: {
		width: '100%',
		backgroundColor: Palette.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
