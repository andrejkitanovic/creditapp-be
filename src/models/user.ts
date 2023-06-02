import { PermissionsType } from 'helpers/permissions';
import { Schema, model, Document } from 'mongoose';

// type TypeWhiteLabeledDomains = 'gmail' | 'deckerdevs';

export enum RolesEnum {
	ADMIN = 'admin',
	PARTNER_ADMIN = 'partner-admin',
	PARTNER = 'partner',
	PARTNER_SALES_REP = 'partner-sales-rep',
}
export type RoleType = `${RolesEnum}`;

interface IUser extends Document {
	organisation: string;
	hubspotId?: string;
	name?: string;
	email: string;
	password: string;
	phone?: string;
	role: RolesEnum;
	confirmed: boolean;
	permissions: PermissionsType[];
}

const userSchema: Schema = new Schema({
	organisation: {
		type: Schema.Types.ObjectId,
		ref: 'Organisation',
		required: true,
	},
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
