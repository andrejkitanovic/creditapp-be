import { Schema, model, Document } from 'mongoose';

interface ICreditEvaluation extends Document {
	customer: string;
}

const creditEvaluationSchema: Schema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
	html: {
		type: String,
	},
});

const objectModel = model<ICreditEvaluation>('Credit Evaluation', creditEvaluationSchema);

export { ICreditEvaluation };
export default objectModel;
