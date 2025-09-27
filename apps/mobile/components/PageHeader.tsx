import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GlassContainer, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/lib/Theme';

import { GlassView } from './GlassView';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

type PageHeaderProps = {
	title: string;
} & React.PropsWithChildren;

export const PageHeader: React.FC<PageHeaderProps> = (props) => {
	const { children, title } = props;

	const safeAreaInsets = useSafeAreaInsets();
	const { theme } = useAppTheme();

	return (
		<ThemedView
			id='header'
			elevation='surface'
			style={[styles.container, { paddingTop: safeAreaInsets.top }]}
			thinBorder
		>
			<Pressable
				onPress={() => {
					router.back();
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
				}}
			>
				{isLiquidGlassAvailable() ? (
					<GlassView
						style={styles.button}
						tintColor='systemChromeMaterialLight'
						isInteractive
					>
						<Ionicons
							name='arrow-back-outline'
							size={24}
							color={theme.colors.textPrimary}
						/>
					</GlassView>
				) : (
					<Ionicons
						name='arrow-back-outline'
						size={24}
						color={theme.colors.textPrimary}
					/>
				)}
			</Pressable>
			<ThemedText style={styles.title}>{title}</ThemedText>
			{children}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
		paddingHorizontal: 15,
		minHeight: 48,
		justifyContent: 'flex-start',
		alignItems: 'center',
		flexDirection: 'row',
		paddingBottom: 10,
		gap: 10,
	},
	title: {
		fontWeight: 'bold',
		fontFamily: 'InstrumentSerif_400Regular',
		letterSpacing: -0.5,
		fontSize: 48,
		paddingLeft: 5,
		paddingRight: 5,
	},
	button: {
		height: 40,
		width: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
