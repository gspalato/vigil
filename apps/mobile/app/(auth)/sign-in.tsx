import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { blue } from 'react-native-reanimated/lib/typescript/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Page() {
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
				router.replace('/');
			} else {
				// If the status isn't complete, check why. User might need to
				// complete further steps.
				console.error(JSON.stringify(signInAttempt, null, 2));
			}
		} catch (err) {
			// See https://clerk.com/docs/custom-flows/error-handling
			// for more info on error handling
			console.error(JSON.stringify(err, null, 2));
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<Text style={styles.title}>Sign in</Text>
			<TextInput
				style={styles.input}
				autoCapitalize='none'
				value={emailAddress}
				placeholder='Enter email'
				onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
			/>
			<TextInput
				style={styles.input}
				value={password}
				placeholder='Enter password'
				secureTextEntry={true}
				onChangeText={(password) => setPassword(password)}
			/>
			<TouchableOpacity style={styles.button} onPress={onSignInPress}>
				<Text style={styles.buttonText}>Continue</Text>
			</TouchableOpacity>
			<View style={styles.signUpContainer}>
				<Text>Don't have an account?</Text>
				<Link href='/sign-up.tsx'>
					<Text style={styles.signUpLink}>Sign up</Text>
				</Link>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	header: {
		width: '100%',
		backgroundColor: 'blue',
		alignItems: 'center',
		justifyContent: 'center',
	},
	 container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#A9A9A9',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        gap: 5,
    },
    signUpLink: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
