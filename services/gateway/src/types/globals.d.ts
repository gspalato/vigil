export {};

// Create a type for the roles
export type Roles = 'system' | 'admin' | 'developer';

declare global {
	interface CustomJwtSessionClaims {
		metadata: {
			role?: Roles;
		};
	}
}
