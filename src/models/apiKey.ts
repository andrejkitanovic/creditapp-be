import { PermissionsType } from 'helpers/permissions';
import { Schema, model, Document } from 'mongoose';

interface IApiKey extends Document {
	label: string;
	hashedKey: string;
	prefix: string;
	organisation: string;
	permissions: PermissionsType[];
	active: boolean;
	createdBy?: string;
	lastUsedAt?: Date;
}

const apiKeySchema: Schema = new Schema(
	{
		// Human-readable name, e.g. "HubSpot workflow - Michael"
		label: {
			type: String,
			required: true,
		},
		// SHA-256 of the plaintext key. The plaintext is shown once on creation and never stored.
		hashedKey: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		// First chars of the key (e.g. "lz_a1b2c3d4") so a key can be identified in a list.
		prefix: {
			type: String,
			required: true,
		},
		// The key authenticates as this organisation (drives credit-evaluation scoping).
		organisation: {
			type: Schema.Types.ObjectId,
			ref: 'Organisation',
			required: true,
		},
		// Scopes this key may exercise, e.g. ['read:credit-evaluations'].
		permissions: [
			{
				type: String,
			},
		],
		// Revoke a key by setting this to false - no DECODE_KEY rotation required.
		active: {
			type: Boolean,
			default: true,
		},
		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		lastUsedAt: {
			type: Date,
		},
	},
	{ timestamps: true }
);

const objectModel = model<IApiKey>('ApiKey', apiKeySchema);

export { IApiKey };
export default objectModel;
