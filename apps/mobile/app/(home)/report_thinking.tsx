import { View } from 'react-native';

import { AiBlob } from '@components/AiBlob';

import { Palette } from '@/lib/palette';

export default function Page() {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: Palette.background,
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<AiBlob
				style={{ height: 300, width: 300 }}
				// @ts-ignore
				sharedTransitionTag='aiblob'
			/>
		</View>
	);
}
