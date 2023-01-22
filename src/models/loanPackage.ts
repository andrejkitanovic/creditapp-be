import { Schema, model, Document } from 'mongoose';
import { MongooseFindByReference } from 'mongoose-find-by-reference';

interface ILoanPackage extends Document {
	customer: string;
	creditEvaluation: string;
	hubspotId?: string;

	amount: number;
}

const loanPackageSchema: Schema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
	creditEvaluation: {
		type: Schema.Types.ObjectId,
		ref: 'Credit Evaluation',
		required: true,
	},
	hubspotId: {
		type: String,
	},

	amount: {
		type: Number,
	},
});

loanPackageSchema.plugin(MongooseFindByReference);
const objectModel = model<ILoanPackage>('Loan Package', loanPackageSchema);

export { ILoanPackage };
export default objectModel;
