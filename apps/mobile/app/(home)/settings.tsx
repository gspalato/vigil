import { Protect, useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
import { GlassView } from '@components/GlassView';
import { GlassView as AdaptativeGlassView } from '@components/GlassView';
import { PageHeader } from '@components/PageHeader';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';

import { useApi } from '@lib/api';
import { Palette } from '@lib/palette';
import { getApproximateScreenCornerRadius } from '@lib/utils';

export default function Page() {
	const borderRadius = getApproximateScreenCornerRadius();

	const { signOut } = useAuth();
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
						<View
							style={{
								flex: 1,
								justifyContent: 'center',
								alignItems: 'flex-end',
							}}
						>
							<Pressable
								onPress={async () => {
									Haptics.impactAsync(
										Haptics.ImpactFeedbackStyle.Medium,
									);
									await signOut();
									router.replace('/(auth)/sign-in');
								}}
							>
								{isLiquidGlassAvailable() ? (
									<GlassView
										style={styles.logoutButton}
										tintColor='#ff000055'
										isInteractive
									>
										<MaterialCommunityIcons
											name='logout'
											size={20}
											color='black'
										/>
									</GlassView>
								) : (
									<AdaptativeGlassView
										style={[
											styles.logoutButton,
											{ backgroundColor: '#ff000055' },
										]}
									>
										<MaterialCommunityIcons
											name='logout'
											size={20}
											color='black'
										/>
									</AdaptativeGlassView>
								)}
							</Pressable>
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
					<Protect permission='org:developer:debug'>
						<View style={{ flexDirection: 'column', gap: 5 }}>
							<ThemedText
								type='body'
								size='xs'
								style={{ color: '#888', paddingLeft: 5 }}
							>
								Developer Settings
							</ThemedText>
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
							></ThemedView>
						</View>
					</Protect>
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
	logoutButton: {
		height: 40,
		width: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
