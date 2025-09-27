import {
	Entypo,
	FontAwesome5,
	FontAwesome6,
	Ionicons,
} from '@expo/vector-icons';
import { StackActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
	GlassView as ExpoGlassView,
	GlassContainer,
	isLiquidGlassAvailable,
} from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Link, Redirect, router, Stack, useNavigation } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/lib/Theme';

import { GlassView } from './GlassView';
import { ThemedView } from './ThemedView';

type HomeNavbarProps = {
	disableLiquidGlass?: boolean;
};

export const HomeNavbar: React.FC<HomeNavbarProps> = (props) => {
	const { disableLiquidGlass = false } = props;

	const { theme, themeName } = useAppTheme();

	const glassTint =
		themeName === 'dark' ? undefined : 'systemChromeMaterialLight';

	return isLiquidGlassAvailable() && !disableLiquidGlass ? (
		<ThemedView
			style={{
				flexDirection: 'row',
				justifyContent: 'center',
				gap: 10,
				marginHorizontal: 'auto',
			}}
		>
			<GlassContainer style={[styles.toolbar, { gap: -10 }]} spacing={50}>
				<ExpoGlassView
					style={[styles.toolbar, { width: 50, marginRight: 0 }]}
					tintColor={glassTint}
					isInteractive
				>
					<Pressable
						onPress={() =>
							Haptics.impactAsync(
								Haptics.ImpactFeedbackStyle.Medium,
							).then(() => router.push('/(home)/settings'))
						}
						style={styles.toolbarButton}
					>
						<FontAwesome5
							name='user-alt'
							size={18}
							color={theme.colors.textSecondary}
						/>
					</Pressable>
				</ExpoGlassView>
				<ExpoGlassView
					style={[styles.toolbar, { width: 50 }]}
					tintColor={glassTint}
					isInteractive
				>
					<Pressable
						onPress={() =>
							Haptics.impactAsync(
								Haptics.ImpactFeedbackStyle.Medium,
							).then(() => router.push('/(home)/history'))
						}
						style={styles.toolbarButton}
					>
						<FontAwesome6
							name='list-ul'
							size={20}
							color={theme.colors.textSecondary}
						/>
					</Pressable>
				</ExpoGlassView>
			</GlassContainer>
			<Pressable
				onPress={() =>
					Haptics.impactAsync(
						Haptics.ImpactFeedbackStyle.Medium,
					).then(() => router.push('/(home)/report'))
				}
			>
				<ExpoGlassView
					style={[styles.toolbar, { width: 50 }]}
					tintColor={glassTint}
					isInteractive
				>
					<FontAwesome6
						name='plus'
						size={24}
						color={theme.colors.textSecondary}
					/>
				</ExpoGlassView>
			</Pressable>
		</ThemedView>
	) : (
		<ThemedView
			style={{
				flexDirection: 'row',
				justifyContent: 'center',
				gap: 10,
				marginHorizontal: 'auto',
			}}
		>
			<GlassView style={styles.toolbar}>
				<Pressable
					onPress={() =>
						Haptics.impactAsync(
							Haptics.ImpactFeedbackStyle.Medium,
						).then(() => router.push('/(home)/settings'))
					}
					style={styles.toolbarButton}
				>
					<FontAwesome5
						name='user-alt'
						size={18}
						color={theme.colors.textSecondary}
					/>
				</Pressable>
				<Pressable
					onPress={() =>
						Haptics.impactAsync(
							Haptics.ImpactFeedbackStyle.Medium,
						).then(() => router.push('/(home)/report'))
					}
					style={styles.toolbarButton}
				>
					<FontAwesome6
						name='list-ul'
						size={20}
						color={theme.colors.textSecondary}
					/>
				</Pressable>
			</GlassView>
			<Pressable
				onPress={() =>
					Haptics.impactAsync(
						Haptics.ImpactFeedbackStyle.Medium,
					).then(() => router.push('/(home)/report'))
				}
			>
				<GlassView
					style={[styles.toolbar, { width: 50 }]}
					isInteractive
				>
					<FontAwesome6
						name='plus'
						size={24}
						color={theme.colors.textSecondary}
					/>
				</GlassView>
			</Pressable>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	profileButton: {
		height: 35,
		width: 35,
		borderRadius: 10,
		borderColor: '#ffffff',
		borderWidth: 2.5,
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 0,
		},
		shadowOpacity: 1,
		shadowRadius: 5,
	},
	toolbarContainer: {
		position: 'absolute',
		top: 200,
		left: 50,
		width: 250,
		height: 100,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	toolbar: {
		height: 50,
		width: 'auto',
		borderRadius: 50,
		//marginHorizontal: "auto",
		gap: 10,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 8,
		flexDirection: 'row',
	},
	toolbarButton: {
		height: 35,
		width: 35,
		borderRadius: 35,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
