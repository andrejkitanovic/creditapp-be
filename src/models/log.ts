import { Schema, model, Document } from 'mongoose';

interface ILog extends Document {
	method: 'POST' | 'GET' | 'PUT' | 'DELETE';
	url: string;
	body: string;
}

const logSchema: Schema = new Schema(
	{
		method: {
			type: String,
			enum: ['POST', 'GET', 'PUT', 'DELETE'],
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		body: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

const objectModel = model<ILog>('Log', logSchema);

export { ILog };
export default objectModel;
