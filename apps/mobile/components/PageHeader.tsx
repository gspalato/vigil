import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassContainer, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView } from './GlassView';
import { Pinger } from './Pinger';
import { ThemedText } from './ThemedText';

type PageHeaderProps = {
	title: string;
} & React.PropsWithChildren;

export const PageHeader: React.FC<PageHeaderProps> = (props) => {
	const { children, title } = props;

	const safeAreaInsets = useSafeAreaInsets();
	const navigation = useNavigation();

	return (
		<View
			id='header'
			style={[styles.container, { paddingTop: safeAreaInsets.top }]}
		>
			<Pressable
				onPress={() => {
					navigation.goBack();
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
							color='#000000'
						/>
					</GlassView>
				) : (
					<Ionicons
						name='arrow-back-outline'
						size={24}
						color='#000000'
					/>
				)}
			</Pressable>
			<ThemedText style={styles.title}>{title}</ThemedText>
			{children}
		</View>
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
		backgroundColor: '#ffffff',
		paddingBottom: 10,
		gap: 10,
	},
	title: {
		fontWeight: 'bold',
		color: '#000000',
		fontFamily: 'InstrumentSerif_400Regular',
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
