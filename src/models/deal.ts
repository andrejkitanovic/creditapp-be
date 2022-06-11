import { Schema, model, Document } from 'mongoose';

interface IDeal extends Document {
	customer: string;
}

const dealSchema: Schema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
});

const objectModel = model<IDeal>('Deal', dealSchema);

export { IDeal };
export default objectModel;
