import { BlurView } from 'expo-blur';
import {
	forwardRef,
	PropsWithChildren,
	useImperativeHandle,
	useState,
} from 'react';
import { ViewStyle } from 'react-native';
import { Modal } from 'react-native-reanimated-modal';

type ImperativeModalProps = {
	contentContainerStyle?: ViewStyle;

	canDismiss?: boolean;
} & PropsWithChildren;

export const ImperativeModal = forwardRef(
	(
		{
			children,
			contentContainerStyle,
			canDismiss = true,
		}: ImperativeModalProps,
		ref,
	) => {
		const [visible, setVisible] = useState(true);
		const onHide = () => setVisible(false);

		useImperativeHandle(ref, () => ({
			show: () => setVisible(true),
			hide: () => setVisible(false),
		}));

		return (
			<Modal
				visible={visible}
				onHide={canDismiss ? onHide : undefined}
				animation={{
					type: 'scale',
					duration: 200,
					scaleFactor: 0.75,
				}}
				contentContainerStyle={[
					{
						justifyContent: 'center',
						alignItems: 'center',
					},
					contentContainerStyle,
				]}
				backdrop={
					<BlurView tint='dark' intensity={20} style={{ flex: 1 }} />
				}
			>
				{children}
			</Modal>
		);
	},
);
