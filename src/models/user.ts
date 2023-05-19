import { PermissionsType } from 'helpers/permissions';
import { Schema, model, Document } from 'mongoose';

// type TypeWhiteLabeledDomains = 'gmail' | 'deckerdevs';

enum RolesEnum {
	ADMIN = 'admin',
	PARTNER = 'partner',
}
export type RoleType = `${RolesEnum}`;

interface IUser extends Document {
	hubspotId?: string;
	name?: string;
	email: string;
	password: string;
	phone?: string;
	role: RolesEnum;
	confirmed: boolean;
	permissions: PermissionsType[];

	// Partners
	active: boolean;
	companyName: string;
	leadSource: string;
	// salesRepName: string;
	// salesRepEmail: string;
	brand: string[];
	emailNotification: boolean;
}

const userSchema: Schema = new Schema({
	hubspotId: {
		type: String,
	},
	name: {
		type: String,
	},
	password: {
		type: String,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	phone: {
		type: String,
	},
	role: {
		type: String,
		enum: RolesEnum,
		default: RolesEnum.PARTNER,
	},
	confirmed: {
		type: Boolean,
		default: false,
	},
	permissions: [
		{
			type: String,
		},
	],
});

const objectModel = model<IUser>('User', userSchema);

export { IUser };
export default objectModel;
