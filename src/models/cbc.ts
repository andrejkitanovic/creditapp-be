import { Schema, model, Document } from 'mongoose';

interface ICBC extends Document {
	password: string;
	nextReset: Date;
}

const cbcSchema: Schema = new Schema({
	password: {
		type: String,
		required: true,
	},
	nextReset: {
		type: Date,
		required: true,
	},
});

const objectModel = model<ICBC>('CBC', cbcSchema);

export { ICBC };
export default objectModel;
