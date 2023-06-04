import { Schema, model, Document } from 'mongoose';

interface IOrganisation extends Document {
	hubspotId: string;
	type: 'admin' | 'partner';
	active: boolean;
	name: string;
	email: string;
	leadSource: string;
	brand: string;
	partnerPayout: {
		active: boolean;
		type: 'they-invoice' | 'percentage';
		value: number;
	};
}

const organisationSchema: Schema = new Schema(
	{
		hubspotId: {
			type: String,
		},
		type: {
			type: String,
			enum: ['admin', 'partner'],
			default: 'partner',
		},
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		active: {
			type: Boolean,
			default: true,
		},
		leadSource: {
			type: String,
		},
		brand: {
			type: String,
		},
		partnerPayout: {
			active: {
				type: Boolean,
			},
			type: {
				type: String,
				enum: ['they-invoice', 'percentage'],
				default: 'they-invoice',
			},
			value: {
				type: Number,
			},
		},
	},
	{ timestamps: true }
);

const objectModel = model<IOrganisation>('Organisation', organisationSchema);

export { IOrganisation };
export default objectModel;
