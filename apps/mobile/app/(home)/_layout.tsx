import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

import { useAppTheme } from '@lib/Theme';

export default function HomeLayout() {
	const { theme } = useAppTheme();

	return (
		<Stack
			screenOptions={{
				headerShown: false,
				contentStyle: { backgroundColor: theme.colors.background },
			}}
		>
			<Stack.Screen
				name='membership_ticket'
				options={{
					presentation: 'transparentModal',
				}}
			/>
		</Stack>
	);
}
