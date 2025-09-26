import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

export default function HomeLayout() {
	const { isSignedIn } = useAuth();

	if (isSignedIn) {
		console.log('HomeLayout detected user is signed in via Clerk.');
		return <Redirect href='/(home)' />;
	}

	return <Stack screenOptions={{ headerShown: false }} />;
}
