import { Schema, model, Document } from 'mongoose';

interface IOrganisation extends Document {
	active: boolean;
	name: string;
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
		name: {
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
