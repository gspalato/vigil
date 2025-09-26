import { useAuth } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Redirect as ERRedirect, Stack as ERStack } from 'expo-router';
import { useEffect } from 'react';

import SignInScreen from './sign-in';
import SignUpScreen from './sign-up';

export const Stack = createNativeStackNavigator();

export default function AuthRoutesLayout() {
	const { isSignedIn } = useAuth();

	const navigation = useNavigation();

	/* Expo Router */
	/*
  if (isSignedIn) {
    return <Redirect href={'/'} />
  }
  return <Stack screenOptions={{
        headerShown: false
      }} />
    */

	useEffect(() => {
		if (isSignedIn) {
			navigation.navigate('home'); // Navigate to the home screen
		}
	}, [isSignedIn, navigation]);

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
			}}
			initialRouteName='sign-in'
		>
			<Stack.Screen name='sign-in' component={SignInScreen} />
			<Stack.Screen name='sign-up' component={SignUpScreen} />
		</Stack.Navigator>
	);
}
