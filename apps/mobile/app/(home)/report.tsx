import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { router } from 'expo-router';
import { Button, TextField } from 'heroui-native';
import { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';

import { ActivityStatus } from '@components/ActivityIndicator';
import { AiBlob } from '@components/AiBlob';
import { SplitButtons2 } from '@components/SplitButtons2';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';

import { ThemedButton } from '@/components/ThemedButton';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';

import { useApi } from '@lib/api';
import { Palette } from '@lib/palette';

export default function Page() {
	const { reportSymptoms } = useApi();

	const [text, setText] = useState('');
	const [status, setStatus] = useState<ActivityStatus>('idle');

	const [splitted, setSplitted] = useState(true);

	const analyze = async () => {
		if (text.trim().length === 0) {
			return;
		}

		setStatus('loading');
		try {
			const res = await reportSymptoms(text);
			console.log(res);

			if (res.success) {
				setStatus('success');
			}

			router.setParams({ result: JSON.stringify(res) });
			router.push('report_result');
		} catch (error: any) {
			console.error('Error reporting symptoms:', error);
			setStatus('error');

			router.setParams({
				result: JSON.stringify({
					success: false,
					message: error.message,
				}),
			});
			router.push('report_result');
		}
	};

	return (
		<>
			<ThemedSafeAreaView
				style={{
					flex: 1,
				}}
			>
				<KeyboardAwareScrollView
					style={{ flex: 1 }}
					//behavior={Platform.OS === "ios" ? "padding" : undefined}
					contentContainerStyle={{
						flex: 1,
						justifyContent: 'flex-start',
						alignItems: 'center',
						padding: 20,
						paddingBottom: 0,
						flexDirection: 'column',
						gap: 20,
						backgroundColor: 'transparent',
					}}
				>
					<StatusBar barStyle={'dark-content'} />
					<ThemedView
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
							How are you feeling today?
						</ThemedText>
					</ThemedView>
					<TextField isRequired style={{ width: '100%' }}>
						<TextField.Input
							placeholder='Describe your symptoms, you can define their intensity as well.'
							multiline
							style={{ fontFamily: 'InstrumentSans_400Regular' }}
							onChangeText={setText}
						/>
					</TextField>
					<ThemedButton onPress={analyze}>
						<ThemedText size='sm' type='button'>
							Analyze
						</ThemedText>
					</ThemedButton>
					{/*
					<View
						style={{
							width: '100%',
							gap: 10,
							flexDirection: 'row',
							marginTop: 'auto',
						}}
					>
						<Button
							variant='primary'
							size='md'
							style={{
								borderRadius: 50,
								flex: 1,
							}}
							onPress={() => navigation.goBack()}
						>
							<Button.StartContent>
								<Ionicons
									name='chevron-back'
									size={18}
									color={'#fff'}
								/>
							</Button.StartContent>
							<Button.LabelContent>
								<ThemedText
									style={{ fontSize: 15, color: '#fff' }}
									type='button'
								>
									Back
								</ThemedText>
							</Button.LabelContent>
						</Button>
						<Button
							variant='primary'
							size='md'
							style={{
								borderRadius: 50,
								flex: 1,
							}}
							onPress={analyze}
						>
							<Button.LabelContent>
								<ThemedText
									style={{ fontSize: 15, color: '#fff' }}
									type='button'
								>
									Analyze
								</ThemedText>
							</Button.LabelContent>
							<Button.EndContent>
								<Ionicons
									name='chevron-forward'
									size={18}
									color={'#fff'}
								/>
							</Button.EndContent>
						</Button>
					</View>
          		*/}
				</KeyboardAwareScrollView>
			</ThemedSafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingBottom: 64,
	},
	icon: {
		marginRight: 8,
		justifyContent: 'center',
		alignItems: 'center',
		width: 18,
		height: 18,
		marginBottom: -1.5,
	},
});
