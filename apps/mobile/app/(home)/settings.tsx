import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Avatar } from 'heroui-native';
import { useEffect } from 'react';
import {
	Pressable,
	ScrollView,
	StatusBar,
	StyleSheet,
	View,
} from 'react-native';
import { Text } from 'react-native';

import { GitHubHeatmap } from '@components/GithubHeatmap';
import { generateContributionFromReports } from '@components/GithubHeatmap/convert';
import { GlassView } from '@components/GlassView';
import { PageHeader } from '@components/PageHeader';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';

import { useApi } from '@lib/api';

import { Palette } from '@/lib/palette';

import { getApproximateScreenCornerRadius } from '../../lib/utils';

export default function Page() {
	const borderRadius = getApproximateScreenCornerRadius();

	const user = useUser();
	const { myReports, fetchMyReports } = useApi();

	useEffect(() => {
		fetchMyReports();
	}, []);

	return (
		<>
			<StatusBar barStyle='dark-content' />
			<View style={styles.page}>
				<PageHeader title='Settings' />
				<ScrollView
					style={{ padding: 20, flex: 1 }}
					contentContainerStyle={{ gap: 20 }}
				>
					<ThemedView
						style={{
							backgroundColor: '#fff',
							borderRadius: borderRadius.dp / 3,
							flexDirection: 'row',
							gap: 20,
							padding: 20,
						}}
						elevation='surface'
						thinBorder
					>
						<Avatar size={'lg'} alt='Avatar'>
							<Avatar.Image
								source={{ uri: user.user?.imageUrl }}
							/>
							<Avatar.Fallback />
						</Avatar>
						<View
							style={{
								justifyContent: 'center',
								flexDirection: 'column',
								gap: 2,
							}}
						>
							<ThemedText type='title' size='lg'>
								{user.user?.fullName}
							</ThemedText>
							<ThemedText size='xs' style={{ color: '#666' }}>
								{user.user?.primaryEmailAddress?.emailAddress}
							</ThemedText>
						</View>
					</ThemedView>
					<View style={{ flexDirection: 'column', gap: 5 }}>
						<ThemedText
							type='body'
							size='xs'
							style={{ color: '#888', paddingLeft: 5 }}
						>
							Your Health History
						</ThemedText>
						<GitHubHeatmap
							reports={myReports.map((r) => ({
								timestamp: r.timestamp,
								symptoms: r.symptoms,
							}))}
						/>
					</View>
				</ScrollView>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	page: { flex: 1, backgroundColor: Palette.background },
	header: {
		width: '100%',
		backgroundColor: '#ffffff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
