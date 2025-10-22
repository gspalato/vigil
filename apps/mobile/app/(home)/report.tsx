import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Button, TextField } from 'heroui-native';
import LottieView from 'lottie-react-native';
import {
	forwardRef,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';
import { Modal } from 'react-native-reanimated-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityStatus } from '@components/ActivityIndicator';
import { AiBlob } from '@components/AiBlob';
import { SplitButtons2 } from '@components/SplitButtons2';
import { ThemedText } from '@components/ThemedText';
import { ThemedView } from '@components/ThemedView';

import { ImperativeModal } from '@/components/ImperativeModal';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedGradientButton } from '@/components/ThemedGradientButton';
import { ThemedSafeAreaView } from '@/components/ThemedSafeAreaView';

import { useApi } from '@lib/api';
import { Palette } from '@lib/palette';

import { useAppTheme } from '@/lib/Theme';

export default function Page() {
	const { theme } = useAppTheme();
	const { reportSymptoms } = useApi();

	const [text, setText] = useState('');
	const [status, setStatus] = useState<ActivityStatus>('idle');

	const processingModalRef = useRef<any>(null);
	const invalidInputModalRef = useRef<any>(null);

	const analyze = async () => {
		if (text.trim().length === 0) {
			invalidInputModalRef?.current?.show();
			return;
		}

		processingModalRef?.current?.show();
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

	const insets = useSafeAreaInsets();

	return (
		<>
			<KeyboardAwareScrollView
				style={{ flex: 1 }}
				//behavior={Platform.OS === "ios" ? "padding" : undefined}
				contentContainerStyle={{
					flex: 1,
					justifyContent: 'flex-start',
					alignItems: 'center',
					padding: 20,
					flexDirection: 'column',
					gap: 20,
					backgroundColor: 'transparent',

					paddingTop: insets.top + 20,
					paddingBottom: 0,
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
				<TextField isRequired style={{ width: '100%', flex: 1 }}>
					<TextField.Input
						placeholder='Describe your symptoms, you can define their intensity as well.'
						multiline
						style={{ fontFamily: 'InstrumentSans_400Regular' }}
						onChangeText={setText}
						colors={{
							blurBackground: theme.colors.surface,
							focusBackground: theme.colors.surface,

							blurBorder: theme.colors.border,
							focusBorder: theme.colors.borderLight,
						}}
					/>
				</TextField>
				<ThemedGradientButton
					pressableStyle={{ width: '100%' }}
					viewStyle={{
						height: 50,
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: theme.borderRadii.screen,
					}}
					onPress={analyze}
				>
					<ThemedText size='sm' type='button'>
						Analyze
					</ThemedText>
				</ThemedGradientButton>
			</KeyboardAwareScrollView>
			<InvalidInputModal ref={invalidInputModalRef} />
			<ProcessingModal ref={processingModalRef} />
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

// Modals
const ProcessingModal = forwardRef((props, ref) => {
	const { theme } = useAppTheme();

	const modalRef = useRef<any>(null);

	useImperativeHandle(ref, () => ({
		show: () => modalRef?.current?.show(),
		hide: () => modalRef?.current?.hide(),
	}));

	return (
		<ImperativeModal
			ref={modalRef}
			contentContainerStyle={{ gap: 0 }}
			canDismiss={false}
		>
			<ThemedView
				elevation='surface'
				style={{
					alignItems: 'center',
					borderRadius: theme.borderRadii.sm,

					width: '80%',

					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 0,
					},
					shadowOpacity: 0.1,
					shadowRadius: 6,
				}}
				thinBorder
			>
				<ThemedView
					style={{ padding: 20, alignItems: 'center', gap: 10 }}
				>
					<ThemedText type='title' size='lg'>
						Processing...
					</ThemedText>
					<LottieView
						autoPlay
						loop
						style={{ width: 50, height: 50 }}
						source={require('../../assets/lotties/loading_gray.json')}
					/>
				</ThemedView>
			</ThemedView>
		</ImperativeModal>
	);
});

const InvalidInputModal = forwardRef((props, ref) => {
	const { theme } = useAppTheme();

	const modalRef = useRef<any>(null);

	useImperativeHandle(ref, () => ({
		show: () => modalRef?.current?.show(),
		hide: () => modalRef?.current?.hide(),
	}));

	return (
		<ImperativeModal ref={modalRef} contentContainerStyle={{ gap: 0 }}>
			<ThemedView
				elevation='surface'
				style={{
					alignItems: 'center',
					borderRadius: theme.borderRadii.sm,

					width: '80%',

					shadowColor: '#000',
					shadowOffset: {
						width: 0,
						height: 0,
					},
					shadowOpacity: 0.1,
					shadowRadius: 6,
				}}
				thinBorder
			>
				<ThemedView
					style={{ padding: 20, alignItems: 'center', gap: 10 }}
				>
					<ThemedText type='title' size='lg'>
						Fill the input!
					</ThemedText>
					<ThemedText type='body' size='sm'>
						Please describe your symptoms before analyzing.
					</ThemedText>
				</ThemedView>
				<ThemedButton
					pressableStyle={{
						marginTop: 10,
						width: '100%',
					}}
					viewStyle={{
						width: '100%',
						alignItems: 'center',
						borderColor: theme.colors.border,
						borderTopWidth: StyleSheet.hairlineWidth,
						padding: 16,
					}}
					onPress={() => modalRef?.current?.hide()}
				>
					<ThemedText type='button'>Got it!</ThemedText>
				</ThemedButton>
			</ThemedView>
		</ImperativeModal>
	);
});
