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
		default: RolesEnum.USER
	},
});

const objectModel = model<IUser>('User', userSchema);

export { IUser };
export default objectModel;
