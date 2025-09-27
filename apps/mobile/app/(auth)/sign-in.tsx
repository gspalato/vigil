import { useAuth, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useRouter } from 'expo-router';
import { TextField, TextFieldInputColors } from 'heroui-native';
import { AnimatePresence, Image, MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
	KeyboardAwareScrollView,
	KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@components/Logomark';
import { ThemedButton } from '@components/ThemedButton';
import { ThemedText } from '@components/ThemedText';

import { ThemedView } from '@/components/ThemedView';

import { Palette } from '@lib/palette';
import { AppThemeProvider, useAppTheme } from '@lib/Theme';

export default function Page() {
	const { isSignedIn, signOut } = useAuth();
	const { themeName, theme } = useAppTheme('dark');

	const [currentAuthSection, setCurrentAuthSection] = useState<
		'sign-in' | 'sign-up'
	>('sign-in');

	const MapImage = require('../../assets/map-example.png');

	return (
		<View style={{ flex: 1 }}>
			<View style={{ flex: 1, justifyContent: 'flex-end' }}>
				<View
					style={{
						width: '100%',
						height: '100%',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					}}
				>
					<Image
						source={MapImage}
						style={{
							width: '100%',
							height: '100%',
							backgroundColor: '#000',
						}}
						fadeDuration={500}
					/>
					<View
						style={{
							position: 'absolute',
							height: '100%',
							width: '100%',
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: '#00000055',
							gap: 20,
						}}
					>
						<LinearGradient
							colors={['#00000055', '#000000']}
							style={{
								position: 'absolute',
								height: '100%',
								width: '100%',
							}}
						/>
						<View
							style={{
								alignItems: 'center',
								justifyContent: 'center',
								width: '100%',
								flexDirection: 'row',
								gap: 10,
							}}
						>
							<Icon
								style={{ width: 80, height: 80 }}
								fill={'#fff'}
							/>
							<ThemedText
								type='title'
								style={{
									fontSize: 120,
									paddingBottom: 10,
									color: '#fff',
									textShadowColor: '#00000000',
									textShadowOffset: { width: 0, height: 0 },
									textShadowRadius: 10,
								}}
							>
								Vigil
							</ThemedText>
						</View>
						<AnimatePresence>
							{currentAuthSection === 'sign-in' ? (
								<LoginSection
									setCurrentAuthSection={
										setCurrentAuthSection
									}
								/>
							) : (
								<SignUpSection
									setCurrentAuthSection={
										setCurrentAuthSection
									}
								/>
							)}
						</AnimatePresence>
					</View>
				</View>
			</View>
		</View>
	);
}

type AuthSectionProps = {
	setCurrentAuthSection: (section: 'sign-in' | 'sign-up') => void;
};

const LoginSection = ({ setCurrentAuthSection }: AuthSectionProps) => {
	const { isSignedIn, signOut } = useAuth();
	const { themeName, theme } = useAppTheme('dark');

	const { signIn, setActive, isLoaded } = useSignIn();

	const [emailAddress, setEmailAddress] = React.useState('');
	const [password, setPassword] = React.useState('');

	// Handle the submission of the sign-in form
	const onSignInPress = async () => {
		if (!isLoaded) return;

		// Start the sign-in process using the email and password provided
		try {
			const signInAttempt = await signIn.create({
				identifier: emailAddress,
				password,
			});

			// If sign-in process is complete, set the created session as active
			// and redirect the user
			if (signInAttempt.status === 'complete') {
				await setActive({ session: signInAttempt.createdSessionId });
				router.replace('(home)');
			} else {
				// If the status isn't complete, check why. User might need to
				// complete further steps.
				console.error(
					'incomplete sign in err',
					JSON.stringify(signInAttempt, null, 2),
				);
			}
		} catch (err) {
			// See https://clerk.com/docs/custom-flows/error-handling
			// for more info on error handling
			console.error('catched err', JSON.stringify(err, null, 2));
		}
	};

	return (
		<ThemedView
			style={{
				width: '100%',
				padding: 20,
				paddingHorizontal: 40,
				alignItems: 'center',
				gap: 10,
			}}
			transition={{
				type: 'timing',
				duration: 250,
			}}
			exitTransition={{
				type: 'timing',
				duration: 250,
			}}
			animate={{
				opacity: 1,
				scale: 1,
			}}
			exit={{
				opacity: 0,
				scale: 0.95,
			}}
		>
			<TextField
				isRequired
				style={{
					width: '100%',
				}}
			>
				<TextField.Input
					placeholder='E-mail'
					style={{
						fontFamily: 'InstrumentSans_400Regular',
						color: theme.colors.textPrimary,
					}}
					onChangeText={setEmailAddress}
					colors={{
						blurBackground: theme.colors.surface,
						focusBackground: theme.colors.surface,

						blurBorder: theme.colors.border,
						focusBorder: theme.colors.borderLight,
					}}
				/>
			</TextField>
			<TextField
				isRequired
				style={{
					width: '100%',
				}}
			>
				<TextField.Input
					placeholder='Password'
					secureTextEntry
					style={{
						fontFamily: 'InstrumentSans_400Regular',
						color: theme.colors.textPrimary,
					}}
					colors={{
						blurBackground: theme.colors.surface,
						focusBackground: theme.colors.surface,

						blurBorder: theme.colors.border,
						focusBorder: theme.colors.borderLight,
					}}
					onChangeText={setPassword}
				/>
			</TextField>

			<ThemedButton
				onPress={onSignInPress}
				pressableStyle={{
					width: '100%',
				}}
				viewStyle={{
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					borderWidth: StyleSheet.hairlineWidth,
				}}
				themeOverride='dark'
			>
				<ThemedText
					themeOverride='dark'
					style={{
						fontSize: 15,
					}}
					type='button'
				>
					Sign in
				</ThemedText>
			</ThemedButton>

			<View
				style={{
					display: 'flex',
					flexDirection: 'row',
					gap: 3,
					paddingTop: 10,
				}}
			>
				<Pressable onPress={() => setCurrentAuthSection('sign-up')}>
					<ThemedText size='xs' type='tertiary'>
						Don't have an account? Sign up!
					</ThemedText>
				</Pressable>
			</View>
		</ThemedView>
	);
};

const SignUpSection = ({ setCurrentAuthSection }: AuthSectionProps) => {
	const { theme } = useAppTheme('dark');

	const { isLoaded, signUp, setActive } = useSignUp();
	const router = useRouter();

	const [emailAddress, setEmailAddress] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [pendingVerification, setPendingVerification] = React.useState(false);
	const [code, setCode] = React.useState('');

	// Handle submission of sign-up form
	const onSignUpPress = async () => {
		if (!isLoaded) return;

		console.log(emailAddress, password);

		// Start sign-up process using email and password provided
		try {
			await signUp.create({
				emailAddress,
				password,
			});

			// Send user an email with verification code
			await signUp.prepareEmailAddressVerification({
				strategy: 'email_code',
			});

			// Set 'pendingVerification' to true to display second form
			// and capture OTP code
			setPendingVerification(true);
		} catch (err) {
			// See https://clerk.com/docs/custom-flows/error-handling
			// for more info on error handling
			console.error(JSON.stringify(err, null, 2));
		}
	};

	// Handle submission of verification form
	const onVerifyPress = async () => {
		if (!isLoaded) return;

		try {
			// Use the code the user provided to attempt verification
			const signUpAttempt = await signUp.attemptEmailAddressVerification({
				code,
			});

			// If verification was completed, set the session to active
			// and redirect the user
			if (signUpAttempt.status === 'complete') {
				await setActive({ session: signUpAttempt.createdSessionId });
				router.replace('(home)');
			} else {
				// If the status is not complete, check why. User may need to
				// complete further steps.
				console.error(JSON.stringify(signUpAttempt, null, 2));
			}
		} catch (err) {
			// See https://clerk.com/docs/custom-flows/error-handling
			// for more info on error handling
			console.error(JSON.stringify(err, null, 2));
		}
	};

	if (pendingVerification) {
		return (
			<ThemedView
				style={{
					width: '100%',
					padding: 20,
					paddingHorizontal: 40,
					alignItems: 'center',
					gap: 10,
				}}
				transition={{
					type: 'timing',
					duration: 250,
				}}
				exitTransition={{
					type: 'timing',
					duration: 250,
				}}
				animate={{
					opacity: 1,
					scale: 1,
				}}
				exit={{
					opacity: 0,
					scale: 0.95,
				}}
			>
				<ThemedText>Verify your email</ThemedText>
				<TextField
					isRequired
					style={{
						width: '100%',
					}}
				>
					<TextField.Input
						placeholder='Enter your verification code'
						style={{
							fontFamily: 'InstrumentSans_400Regular',
							color: theme.colors.textPrimary,
						}}
						colors={{
							blurBackground: theme.colors.surface,
							focusBackground: theme.colors.surface,

							blurBorder: theme.colors.border,
							focusBorder: theme.colors.borderLight,
						}}
						onChangeText={setCode}
					/>
				</TextField>
				<ThemedButton
					onPress={onVerifyPress}
					pressableStyle={{
						width: '100%',
					}}
					viewStyle={{
						justifyContent: 'center',
						alignItems: 'center',
						width: '100%',
						borderWidth: StyleSheet.hairlineWidth,
					}}
					themeOverride='dark'
				>
					<ThemedText
						themeOverride='dark'
						style={{
							fontSize: 15,
						}}
						type='button'
					>
						Verify
					</ThemedText>
				</ThemedButton>
			</ThemedView>
		);
	}

	return (
		<ThemedView
			style={{
				width: '100%',
				padding: 20,
				paddingHorizontal: 40,
				alignItems: 'center',
				gap: 10,
			}}
			transition={{
				type: 'timing',
				duration: 250,
			}}
			exitTransition={{
				type: 'timing',
				duration: 250,
			}}
			animate={{
				opacity: 1,
				scale: 1,
			}}
			exit={{
				opacity: 0,
				scale: 0.95,
			}}
		>
			<ThemedText themeOverride='dark' type='tertiary' style={{}}>
				SIGN UP
			</ThemedText>
			<TextField
				isRequired
				style={{
					width: '100%',
				}}
			>
				<TextField.Input
					placeholder='E-mail'
					style={{
						fontFamily: 'InstrumentSans_400Regular',
						color: theme.colors.textPrimary,
					}}
					onChangeText={setEmailAddress}
					colors={{
						blurBackground: theme.colors.surface,
						focusBackground: theme.colors.surface,

						blurBorder: theme.colors.border,
						focusBorder: theme.colors.borderLight,
					}}
				/>
			</TextField>
			<TextField
				isRequired
				style={{
					width: '100%',
				}}
			>
				<TextField.Input
					placeholder='Password'
					secureTextEntry
					style={{
						fontFamily: 'InstrumentSans_400Regular',
						color: theme.colors.textPrimary,
					}}
					colors={{
						blurBackground: theme.colors.surface,
						focusBackground: theme.colors.surface,

						blurBorder: theme.colors.border,
						focusBorder: theme.colors.borderLight,
					}}
					onChangeText={setPassword}
				/>
			</TextField>
			<ThemedButton
				onPress={onSignUpPress}
				pressableStyle={{
					width: '100%',
				}}
				viewStyle={{
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					borderWidth: StyleSheet.hairlineWidth,
				}}
				themeOverride='dark'
			>
				<ThemedText
					themeOverride='dark'
					style={{
						fontSize: 15,
					}}
					type='button'
				>
					Sign up
				</ThemedText>
			</ThemedButton>
			<View
				style={{
					display: 'flex',
					flexDirection: 'row',
					gap: 3,
					paddingTop: 10,
				}}
			>
				<Pressable onPress={() => setCurrentAuthSection('sign-in')}>
					<ThemedText size='xs' type='tertiary'>
						Already have an account? Sign in!
					</ThemedText>
				</Pressable>
			</View>
		</ThemedView>
	);
};
