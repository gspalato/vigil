import { Protect, useAuth, useUser } from '@clerk/clerk-expo';
import { Theme } from '@clerk/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@shopify/restyle';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Avatar } from 'heroui-native';
import { useEffect, useState } from 'react';
import React from 'react';
import {
	Pressable,
	ScrollView,
	StatusBar,
	StyleSheet,
	View,
} from 'react-native';
import { Text } from 'react-native';
import { Modal } from 'react-native-reanimated-modal';

import { GitHubHeatmap } from '@components/GithubHeatmap';
import { GlassView } from '@components/GlassView';
import { GlassView as AdaptativeGlassView } from '@components/GlassView';
import { PageHeader } from '@components/PageHeader';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';

import { MadeByLogomark } from '@/components/Logomark';
import { MembershipTicketModal } from '@/components/MembershipTicket/Modal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedScrollView } from '@/components/ThemedScrollView';

import { useApi } from '@lib/api';
import { Palette } from '@lib/palette';
import { getApproximateScreenCornerRadius } from '@lib/utils';

import { useAppTheme } from '@/lib/Theme';

import { Roles } from '@/types/globals';

export default function Page() {
	const { theme, toggleTheme } = useAppTheme();

	const { signOut } = useAuth();

	const user = useUser();
	const { myReports, fetchMyReports } = useApi();

	const [isTicketModalVisible, setIsTicketModalVisible] = useState(false);

	const userRole: Roles | null = user.user?.publicMetadata['role'] as Roles;

	const SettingsOptions = [
		{
			header: 'General',
			protect: false,
			options: [
				{
					icon: (color: string) => (
						<MaterialCommunityIcons
							name='weather-sunset'
							size={20}
							color={color}
						/>
					),
					label: 'Toggle theme',
					onPress: () => {
						toggleTheme();
					},
				},
			],
		},
		{
			header: 'Developer',
			protect: false,
			options: [
				{
					icon: (color: string) => (
						<Ionicons name='analytics' size={20} color={color} />
					),
					label: 'Trigger reading analysis',
					onPress: () => {
						console.log('Trigger reading analysis pressed');
					},
				},
			],
		},
		{
			header: 'User',
			protect: false,
			options: [
				{
					icon: (color: string) => (
						<MaterialCommunityIcons
							name='logout'
							size={20}
							color={color}
						/>
					),
					label: 'Logout',
					onPress: () => {
						signOut().then(() => router.replace('/(auth)/sign-in'));
					},
				},
			],
		},
	];

	useEffect(() => {
		fetchMyReports();
	}, []);

	return (
		<>
			<StatusBar barStyle='dark-content' />
			<ThemedView style={styles.page}>
				<PageHeader title='Settings' />
				<ThemedScrollView
					style={{ padding: 20, flex: 1 }}
					contentContainerStyle={{ gap: 20, flex: 1 }}
				>
					<ThemedView
						style={{
							borderRadius: theme.borderRadii.sm,
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
						<ThemedView
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
						</ThemedView>
						<ThemedView
							style={{
								flex: 1,
								justifyContent: 'center',
								alignItems: 'flex-end',
							}}
						>
							<Pressable
								onPress={() =>
									//router.push('/(home)/membership_ticket')
									setIsTicketModalVisible(true)
								}
							>
								<GlassView
									style={{
										padding: 10,
										borderRadius: theme.borderRadii.sm,
									}}
								>
									<ThemedText size='sm' type='body'>
										My Ticket
									</ThemedText>
								</GlassView>
							</Pressable>
						</ThemedView>
					</ThemedView>
					<ThemedView
						style={{
							flexDirection: 'column',
							gap: 5,
							height: 'auto',
						}}
					>
						<ThemedText
							type='body'
							size='xs'
							style={{ color: '#888', paddingLeft: 5 }}
						>
							Your Health History
						</ThemedText>
						<ThemedView>
							<GitHubHeatmap
								reports={myReports.map((r) => ({
									timestamp: r.timestamp,
									symptoms: r.symptoms,
								}))}
							/>
						</ThemedView>
					</ThemedView>
					{
						/* Map through settings options */
						SettingsOptions.map((section, index) => {
							if (section.protect && !userRole) {
								return null;
							}

							if (
								Array.isArray(section.protect) &&
								userRole &&
								!section.protect.includes(userRole)
							) {
								return null;
							}

							if (
								typeof section.protect === 'string' &&
								userRole !== section.protect
							) {
								return null;
							}

							return (
								<ThemedView
									style={{
										flexDirection: 'column',
										gap: 5,
									}}
									key={section.header}
								>
									<ThemedText
										type='body'
										size='xs'
										style={{
											color: '#888',
											paddingLeft: 5,
										}}
									>
										{section.header}
									</ThemedText>
									<ThemedView
										style={{
											backgroundColor: 'transparent',
											borderRadius: theme.borderRadii.sm,
											flexDirection: 'column',
											gap: 0,
										}}
										elevation='surface'
									>
										{section.options.map((option, idx) => (
											<ThemedButton
												key={idx}
												onPress={option.onPress}
												viewStyle={[
													styles.sectionButton,
													{
														borderTopWidth:
															idx === 0
																? 0
																: StyleSheet.hairlineWidth,

														borderTopLeftRadius:
															idx === 0
																? theme
																		.borderRadii
																		.sm
																: 0,

														borderTopRightRadius:
															idx === 0
																? theme
																		.borderRadii
																		.sm
																: 0,

														borderBottomLeftRadius:
															idx ===
															section.options
																.length -
																1
																? theme
																		.borderRadii
																		.sm
																: 0,

														borderBottomRightRadius:
															idx ===
															section.options
																.length -
																1
																? theme
																		.borderRadii
																		.sm
																: 0,
													},
												]}
											>
												{option.icon && (
													<View>
														{option.icon(
															theme.colors
																.textSecondary,
														)}
													</View>
												)}
												<ThemedText
													size='sm'
													style={{
														color: theme.colors
															.textSecondary,
													}}
												>
													{option.label}
												</ThemedText>
											</ThemedButton>
										))}
										{/*section.options.map((option, idx) => (
											<Pressable
												key={idx}
												onPress={() => option.onPress()}
											>
												<ThemedView
													style={[
														styles.sectionButton,
														{
															borderTopWidth:
																idx === 0
																	? 0
																	: StyleSheet.hairlineWidth,

															borderTopLeftRadius:
																idx === 0
																	? theme
																			.borderRadii
																			.sm
																	: 0,

															borderTopRightRadius:
																idx === 0
																	? theme
																			.borderRadii
																			.sm
																	: 0,

															borderBottomLeftRadius:
																idx ===
																section.options
																	.length -
																	1
																	? theme
																			.borderRadii
																			.sm
																	: 0,

															borderBottomRightRadius:
																idx ===
																section.options
																	.length -
																	1
																	? theme
																			.borderRadii
																			.sm
																	: 0,
														},
													]}
												>
													{option.icon && (
														<View>
															{option.icon(
																theme.colors
																	.textSecondary,
															)}
														</View>
													)}
													<ThemedText
														size='sm'
														style={{
															color: theme.colors
																.textSecondary,
														}}
													>
														{option.label}
													</ThemedText>
												</ThemedView>
											</Pressable>
										))*/}
									</ThemedView>
								</ThemedView>
							);
						})
					}
					<ThemedView
						style={{
							alignSelf: 'flex-end',
							justifyContent: 'center',
							alignItems: 'center',
							width: '100%',
						}}
					>
						<MadeByLogomark />
					</ThemedView>
				</ThemedScrollView>
				<MembershipTicketModal
					visible={isTicketModalVisible}
					onHide={() => setIsTicketModalVisible(false)}
				/>
			</ThemedView>
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

	sectionButton: {
		padding: 15,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 15,
		height: 50,
	},
});
