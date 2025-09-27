/**
 * Front side of the ticket component displaying event details.
 * Shows date, time, username, and ticket information in a structured layout.
 * Uses platform-specific fonts for iOS and Android.
 */
import { Avatar } from 'heroui-native';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type MembershipTicketFrontSideProps = {
	username: string;
	photoUrl?: string;
	ticketNumber: string;
};

export const FrontSide: React.FC<MembershipTicketFrontSideProps> = (props) => {
	const {
		username = '@example',
		ticketNumber = '00000000',
		photoUrl,
	} = props;

	return (
		<View style={styles.container}>
			<View
				style={{
					flex: 1,
					flexDirection: 'row',
					justifyContent: 'space-between',
				}}
			>
				<View style={{ flex: 1 }}>
					{/* Date section */}
					<View style={styles.section}>
						<Text style={styles.label}>DATE</Text>
						<Text style={styles.value}>
							{new Date().toLocaleDateString()}
						</Text>
					</View>

					{/* Time section */}
					<View style={styles.section}>
						<Text style={styles.label}>TIME</Text>
						<Text style={styles.value}>
							{new Date().toLocaleTimeString()}
						</Text>
					</View>

					{/* Username section */}
					<View style={styles.section}>
						<Text style={styles.label}>USERNAME</Text>
						<Text style={styles.value}>{username}</Text>
					</View>
				</View>

				<Avatar alt='Avatar' style={{ height: 80, width: 80 }}>
					<Avatar.Image source={{ uri: photoUrl }} />
					<Avatar.Fallback />
				</Avatar>
			</View>

			<View style={styles.spacer} />

			{/* Footer with user info and ticket number */}
			<View style={styles.footer}>
				<View style={styles.userInfo}>
					<Text style={styles.platform}>Vigil</Text>
				</View>
				<Text style={styles.ticketNumber}>{ticketNumber}</Text>
			</View>
		</View>
	);
};

/**
 * Styles for the FrontSide component
 */
const styles = StyleSheet.create({
	section: {
		marginBottom: 24,
	},
	container: {
		flex: 1,
		paddingHorizontal: 28,
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		paddingTop: 42,
		paddingBottom: 60,
	},
	textContentContainer: {
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	// Label style with platform-specific font family
	label: {
		fontSize: 13,
		color: '#8E8E93',
		marginBottom: 6,
		fontFamily: 'InstrumentSans_400Regular',
		letterSpacing: 0.5,
		textTransform: 'uppercase',
	},
	// Value style with platform-specific font family
	value: {
		fontSize: 21,
		color: '#1C1C1E',
		fontWeight: '600',
		fontFamily: 'Inter_700Bold',
		letterSpacing: -0.3,
	},
	spacer: {
		flex: 1,
	},
	// Footer section with border and spacing
	footer: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 'auto',
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(60, 60, 67, 0.15)',
		paddingTop: 16,
	},
	userInfo: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	// Username text style with platform-specific font
	username: {
		fontSize: 15,
		color: '#1C1C1E',
		fontFamily: Platform.select({
			ios: 'SF Pro Text',
			default: 'System',
		}),
		fontWeight: '500',
		letterSpacing: -0.1,
	},
	// Platform name style.
	platform: {
		fontSize: 40,
		color: '#1C1C1E',
		fontFamily: 'InstrumentSerif_400Regular',
		letterSpacing: -0.5,
	},
	// Ticket number style with platform-specific font
	ticketNumber: {
		fontSize: 18,
		color: '#8E8E93',
		fontFamily: 'InstrumentSans_400Regular',
		fontWeight: '400',
		letterSpacing: -0.1,
	},
});
