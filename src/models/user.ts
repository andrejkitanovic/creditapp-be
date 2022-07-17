import { PermissionsType } from 'helpers/permissions';
import { Schema, model, Document } from 'mongoose';

// type TypeWhiteLabeledDomains = 'gmail' | 'deckerdevs';

enum RolesEnum {
	ADMIN = 'admin',
	USER = 'user',
}
export type RoleType = `${RolesEnum}`;

interface IUser extends Document {
	hubspotId?: string;
	name?: string;
	email: string;
	phone?: string;
	role: RolesEnum;
	permissions: PermissionsType[];
}

const userSchema: Schema = new Schema({
	hubspotId: {
		type: String,
	},
	name: {
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
		default: RolesEnum.USER,
	},
	confirmed: {
		type: Boolean,
		default: false,
	},
});

const objectModel = model<IUser>('User', userSchema);

export { IUser };
export default objectModel;
