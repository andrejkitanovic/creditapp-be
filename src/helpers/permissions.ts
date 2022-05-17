enum Permissions {
	USERS_READ = 'read:users',
	USERS_WRITE = 'write:users',
	USERS_UPDATE = 'update:users',
	USERS_DELETE = 'delete:users',
}

export type PermissionsType = `${Permissions}`;

// ADMIN PERMISSIONS
export const adminPermissions = Object.values(Permissions);
