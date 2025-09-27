import { useUser } from '@clerk/clerk-expo';
import { BlurView } from 'expo-blur';
import { Modal } from 'react-native-reanimated-modal';

import { BackSide } from './BackSide';
import { FrontSide } from './FrontSide';

import { Ticket } from '../Ticket';

type MembershipTicketModalProps = {
	visible: boolean;
	onHide: () => void;
};

export const MembershipTicketModal: React.FC<MembershipTicketModalProps> = (
	props,
) => {
	const { visible, onHide } = props;

	const { user } = useUser();

	const ticketNumber = hashTo8Digits(user?.fullName ?? 'unknown');

	return (
		<Modal
			visible={visible}
			onHide={onHide}
			animation={{
				type: 'scale',
				duration: 200,
				scaleFactor: 0.75,
			}}
			contentContainerStyle={{
				justifyContent: 'center',
				alignItems: 'center',
			}}
			backdrop={
				<BlurView tint='dark' intensity={20} style={{ flex: 1 }} />
			}
		>
			<Ticket
				width={300}
				height={400}
				frontSide={
					<FrontSide
						username={'@' + user?.username}
						ticketNumber={`#${ticketNumber}`}
						photoUrl={user?.imageUrl}
					/>
				}
				backSide={<BackSide />}
			/>
		</Modal>
	);
};

function hashTo8Digits(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // keep it unsigned
	}
	const num = hash % 100_000_000; // ensures 8 digits max
	return String(num).padStart(8, '0'); // pad with leading zeros
}
