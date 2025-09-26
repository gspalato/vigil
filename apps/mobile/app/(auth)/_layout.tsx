import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

export default function AuthRoutesLayout() {
	const { isSignedIn } = useAuth();

	if (isSignedIn) {
		console.log('AuthRoutesLayout detected user is signed in via Clerk.');
		return <Redirect href={'/'} />;
	}

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: '#000000' },
			}}
		/>
	);
}
