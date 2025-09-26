import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Button, TextField } from 'heroui-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StatusBar, View } from 'react-native';
import {
	KeyboardAwareScrollView,
	KeyboardToolbar,
} from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityStatus } from '@components/ActivityIndicator';
import { AiBlob } from '@components/AiBlob';
import { LoadingButton } from '@components/LoadingButton';
import { ThemedText } from '@components/ThemedText';

import { useApi } from '@lib/api';

import { Palette } from '@/lib/palette';

export default function Page() {
	const { reportSymptoms } = useApi();

	const [text, setText] = useState('');
	const [status, setStatus] = useState<ActivityStatus>('idle');

	const navigation = useNavigation();

	const analyze = async () => {
		if (text.trim().length === 0) {
			return;
		}

		navigation.navigate('report_thinking');

		setStatus('loading');
		try {
			const res = await reportSymptoms(text);
			console.log(res);

			if (res.success) {
				setStatus('success');
				navigation.navigate('report_result', { result: res });
			}
		} catch (error) {
			console.error('Error reporting symptoms:', error);
			setStatus('error');
			return;
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
						{/* 
            <LoadingButton
              status={status}
              onPress={async () => {
                await analyze();
              }}
              style={{
                height: 60,
                borderRadius: 50,
                width: "100%",
              }}
              colorFromStatusMap={{
                idle: "#47A1E6",
                loading: "#47A1E6",
                success: "#5BC682",
                error: "#CD5454",
              }}
              titleFromStatusMap={{
                idle: "Analyze",
                loading: "Analyzing...",
                success: "Done!",
                error: "Failed to analyze.",
              }}
            />
            */}
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
				</KeyboardAwareScrollView>
			</SafeAreaView>
		</>
	);
}
