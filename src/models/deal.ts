import { Schema, model, Document } from 'mongoose';

interface IDeal extends Document {
	customer: string;
	hubspotId?: string;
}

const dealSchema: Schema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
	hubspotId: {
		type: String,
	},
});

const objectModel = model<IDeal>('Deal', dealSchema);

export { IDeal };
export default objectModel;
