import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { router } from 'expo-router';
import { Button, TextField } from 'heroui-native';
import { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityStatus } from '@components/ActivityIndicator';
import { AiBlob } from '@components/AiBlob';
import { ThemedText } from '@components/ThemedText';

import { SplitButtons2 } from '@/components/SplitButtons2';

import { useApi } from '@lib/api';

import { Palette } from '@/lib/palette';

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
			<SafeAreaView
				style={{
					flex: 1,
					backgroundColor: Palette.background,
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
							How are you feeling today?
						</ThemedText>
					</View>
					<TextField isRequired style={{ width: '100%' }}>
						<TextField.Input
							placeholder='Describe your symptoms, you can define their intensity as well.'
							multiline
							style={{ fontFamily: 'InstrumentSans_400Regular' }}
							onChangeText={setText}
						/>
					</TextField>
					<SplitButtons2
						style={{ width: '100%', marginTop: 'auto' }}
						splitted={status === 'idle'}
						gap={10}
						offsetMultiplier={0.3}
						leftButton={(style) => (
							<Animated.View
								style={[
									{
										width: 0,
										position: 'absolute',
										left: 0,
										bottom: 0,
									},
									style,
								]}
							>
								<Button
									variant='secondary'
									size='md'
									style={{
										borderRadius: 50,
										width: '100%',
										right: 0,
									}}
									onPress={() => router.back()}
								>
									<Button.StartContent>
										<Ionicons
											name='chevron-back'
											size={18}
											color={'#000'}
										/>
									</Button.StartContent>
									<Button.LabelContent>
										<ThemedText
											style={{
												fontSize: 15,
												color: '#000',
											}}
											type='button'
										>
											Back
										</ThemedText>
									</Button.LabelContent>
								</Button>
							</Animated.View>
						)}
						rightButton={(style) => (
							<Animated.View
								style={[
									{
										width: 0,
										position: 'absolute',
										right: 0,
										bottom: 0,
									},
									style,
								]}
							>
								<Button
									variant='primary'
									size='md'
									style={{
										borderRadius: 50,
										width: '100%',
									}}
									onPress={analyze}
								>
									<Button.LabelContent>
										<ThemedText
											style={{
												fontSize: 15,
												color: '#fff',
											}}
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
							</Animated.View>
						)}
					/>
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
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
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
