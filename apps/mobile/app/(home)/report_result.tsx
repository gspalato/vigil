import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';

import { AiBlob } from '@components/AiBlob';

import { Palette } from '@/lib/palette';

export default function Page({ route }) {
	const navigation = useNavigation();

	const { result } = route.params || {};

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: Palette.background,
				justifyContent: 'center',
				alignItems: 'center',
			}}
		></View>
	);
}
