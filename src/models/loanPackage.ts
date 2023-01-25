import { Schema, model, Document } from 'mongoose';
import { MongooseFindByReference } from 'mongoose-find-by-reference';
import { calculateAPR, calculateLoanWeightFactor } from 'utils/loans/loansCalculations';

interface ILoanPackage extends Document {
	customer: string;
	creditEvaluation: string;
	hubspotId?: string;

	name: string;
	loanAmount: number;
	monthlyPayment: number;
	term: number;
	interestRate: number;
	loanWeightFactor: number;
	originationFee: number;
	totalOriginationFee: number;
	apr: number;
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

	name: {
		type: String,
		required: true,
	},
	loanAmount: {
		type: Number,
		// required: true,
	},
	monthlyPayment: {
		type: Number,
		// required: true,
	},
	term: {
		type: Number,
		// required: true,
	},
	interestRate: {
		type: Number,
		// required: true,
	},
	loanWeightFactor: {
		type: Number,
		// required: true,
	},
	originationFee: {
		type: Number,
		// required: true,
	},
	totalOriginationFee: {
		type: Number,
	},
	apr: {
		type: Number,
		// required: true,
	},
});

loanPackageSchema.pre('validate', function (next) {
	this.loanWeightFactor = calculateLoanWeightFactor(this.loanAmount, this.interestRate);
	this.apr = calculateAPR(this.loanAmount, this.term, this.interestRate, this.originationFee);

	if (this.originationFee) {
		this.totalOriginationFee = this.loanAmount * (this.originationFee / 100);
	}
	next();
});
loanPackageSchema.plugin(MongooseFindByReference);
const objectModel = model<ILoanPackage>('Loan Package', loanPackageSchema);

export { ILoanPackage };
export default objectModel;
