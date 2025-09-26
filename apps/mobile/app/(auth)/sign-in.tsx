import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Button, TextField, TextFieldInputColors } from 'heroui-native';
import { Image, MotiView } from 'moti';
import React, { useEffect } from 'react';
import {
	KeyboardAvoidingView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import {
	KeyboardAwareScrollView,
	KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@components/ThemedText';

import { Palette } from '@/lib/palette';

const MapImage = require('../../assets/map-example.png');

export default function Page() {
	const { isSignedIn, signOut } = useAuth();

	const { signIn, setActive, isLoaded } = useSignIn();
	const router = useRouter();

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

	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	return (
		<View style={{ flex: 1, backgroundColor: Palette.background }}>
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
						style={{ width: '100%', height: '100%' }}
						fadeDuration={200}
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
							colors={['#00000011', '#121212']}
							locations={[0, 1]}
							style={{
								position: 'absolute',
								height: '100%',
								width: '100%',
							}}
						/>
						<ThemedText
							type='title'
							style={{
								fontSize: 120,
								paddingBottom: 10,
								color: '#ffffff',
							}}
						>
							Vigil
						</ThemedText>
						<MotiView
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
									}}
									onChangeText={setEmailAddress}
									colors={customTextInputColors}
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
									}}
									colors={customTextInputColors}
									onChangeText={setPassword}
								/>
							</TextField>

							<Button
								onPress={onSignInPress}
								style={{
									width: '100%',
								}}
							>
								<Button.Background
									style={{ backgroundColor: '#222' }}
								/>
								<Button.LabelContent>
									<ThemedText
										style={{
											fontSize: 15,
											color: '#fff',
										}}
										type='button'
									>
										Sign in
									</ThemedText>
								</Button.LabelContent>
							</Button>

							<View
								style={{
									display: 'flex',
									flexDirection: 'row',
									gap: 3,
									paddingTop: 10,
								}}
							>
								<ThemedText size='xs' style={{ color: '#fff' }}>
									Don't have an account?
								</ThemedText>
								<Link href='/sign-up'>
									<ThemedText
										size='xs'
										style={{ color: '#fff' }}
									>
										Sign up
									</ThemedText>
								</Link>
							</View>
						</MotiView>
					</View>
				</View>
			</View>
		</View>
	);
}

const customTextInputColors: TextFieldInputColors = {
	blurBackground: '#222',
	focusBackground: '#333',

	blurBorder: '#444',
	focusBorder: '#666',
};
