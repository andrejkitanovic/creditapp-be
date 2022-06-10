import { PermissionsType } from 'helpers/permissions';
import { Schema, model, Document } from 'mongoose';

// type TypeWhiteLabeledDomains = 'gmail' | 'deckerdevs';
enum RolesEnum {
	ADMIN = 'admin',
	USER = 'user',
}
export type RoleType = `${RolesEnum}`;

interface IUser extends Document {
	email: string;
	role: RolesEnum;
	permissions: PermissionsType[];
}

const userSchema: Schema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true,
	},
	role: {
		type: String,
		enum: RolesEnum,
		default: RolesEnum.USER,
	},
	permissions: [{ type: String }],
});

const objectModel = model<IUser>('User', userSchema);

export { IUser };
export default objectModel;
