import { Ionicons } from '@expo/vector-icons';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from 'heroui-native';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import Markdown, {
	ASTNode,
	MarkdownIt,
	stringToTokens,
	tokensToAST,
} from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AiBlob } from '@components/AiBlob';
import { ThemedText } from '@components/ThemedText';

import { Palette } from '@lib/palette';
import { capitalizeFirstLetter } from '@lib/utils';

const markdownItInstance = MarkdownIt({ typographer: true });

export default function Page() {
	let { result } = useLocalSearchParams();

	let parsedResult = JSON.parse(result as string) as {
		success: boolean;
		cause?: string;
		symptoms?: Record<string, number>;
		message?: string;
	};

	const mapStrengthToAdjective = (strength: number) => {
		switch (strength) {
			case 1:
				return 'mild';
			case 2:
				return 'moderate';
			case 3:
				return 'severe';
			default:
				return 'unknown';
		}
	};

	const title = parsedResult?.success
		? "Here's what I got"
		: "Sorry, I couldn't analyze that";

	const body = parsedResult?.success
		? `
Based on the symptoms you provided, it seems like you might be experiencing **${parsedResult.cause}**.
I also identified the following symptoms:

${Object.entries(parsedResult.symptoms!)
	.map(
		([symptom, entry], i, a) =>
			`- ${capitalizeFirstLetter(mapStrengthToAdjective(parsedResult.symptoms![symptom]))} ${symptom}`,
	)
	.join('\n')}

Please remember that this is just an AI-based analysis and not a substitute for professional medical advice!
For an accurate diagnosis and treatment, please consult a healthcare professional.
		`
		: `
I'm sorry, I couldn't analyze the symptoms you provided.

Please, try again with more details, describing your symptoms clearly.

For example, instead of saying "I feel bad", you could say "I have a headache and a sore throat".
		`;

	return (
		<SafeAreaView
			style={{
				flex: 1,
				backgroundColor: Palette.background,
			}}
		>
			<ScrollView
				style={{ flex: 1 }}
				contentInsetAdjustmentBehavior='automatic'
				contentContainerStyle={{
					flex: 1,
					justifyContent: 'flex-start',
					alignItems: 'center',
					padding: 20,
					paddingBottom: 0,
					flexDirection: 'column',
					gap: 20,
				}}
			>
				<StatusBar barStyle={'dark-content'} />
				<View
					style={{
						width: '100%',
						gap: 3,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-start',
					}}
				>
					<AiBlob
						style={{ height: 50, width: 50 }}
						// @ts-ignore
						sharedTransitionTag='aiblob'
					/>
					<ThemedText type='title' size='xl'>
						{parsedResult.success
							? "Here's what I got"
							: "I couldn't analyze that"}
					</ThemedText>
				</View>
				<MotiView
					style={{ width: '100%', flex: 1, paddingHorizontal: 10 }}
					from={{ opacity: 0, translateY: 50 }}
					animate={{ opacity: 1, translateY: 0 }}
					transition={{
						type: 'timing',
						duration: 750,
						delay: 200,
					}}
					key='a'
				>
					<Markdown style={markdownStyles}>{body}</Markdown>
				</MotiView>
			</ScrollView>
			<View style={{ width: '100%', paddingHorizontal: 20 }}>
				<Button
					variant='secondary'
					size='md'
					style={{
						borderRadius: 50,
						width: '100%',
					}}
					onPress={() => router.dismissTo('(home)')}
				>
					{/*
					<Button.StartContent>
						<Ionicons
							name='chevron-back'
							size={18}
							color={'#000'}
						/>
					</Button.StartContent>
					*/}
					<Button.LabelContent>
						<ThemedText
							style={{
								fontSize: 17,
								color: '#000',
							}}
							type='button'
						>
							Got it!
						</ThemedText>
					</Button.LabelContent>
				</Button>
			</View>
		</SafeAreaView>
	);
}

const markdownStyles = StyleSheet.create({
	body: {
		fontSize: 20,
		fontFamily: 'InstrumentSans_400Regular',
		lineHeight: 26,
		textAlign: 'justify',
		color: '#000',
	},
	strong: {
		fontFamily: 'InstrumentSans_700Bold',
	},
	heading1: {
		fontFamily: 'InstrumentSerif_400Regular',
		fontSize: 24,
		marginBottom: 12,
		color: '#000',
	},
	heading2: {
		fontFamily: 'InstrumentSerif_400Regular',
		fontSize: 20,
		marginBottom: 10,
		color: '#000',
	},
	heading3: {
		fontFamily: 'InstrumentSerif_400Regular',
		fontSize: 18,
		marginBottom: 8,
		color: '#000',
	},
});
