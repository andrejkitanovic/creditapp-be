import { Schema, model, Document } from 'mongoose';

interface IOrganisation extends Document {
	hubspotId: string;
	active: boolean;
	name: string;
	email: string;
	leadSource: string;
	brand: string[];
	partnerPayout: {
		active: boolean;
		type: 'percentage';
		value: number;
	};
}

const organisationSchema: Schema = new Schema(
	{
		hubspotId: {
			type: String,
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
		brand: [
			{
				type: String,
			},
		],
		partnerPayout: {
			active: {
				type: Boolean,
				default: true,
			},
			type: {
				type: String,
				enum: ['percentage'],
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
