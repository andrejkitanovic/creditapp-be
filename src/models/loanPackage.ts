import { Schema, model, Document } from 'mongoose';
import { MongooseFindByReference } from 'mongoose-find-by-reference';
import { calculateAPR, calculateLoanWeightFactor } from 'utils/loans/loansCalculations';

interface ILoanPackage extends Document {
	hubspotId?: string;
	customer: string;
	leadSource: string;
	creditEvaluation: string;

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
	leadSource: {
		type: String,
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

loanPackageSchema.pre('findOneAndUpdate', async function (next) {
	//@ts-expect-error
	let rawObject = await this.findOne({ _id: this._conditions._id }).lean().clone();
	rawObject = {
		...rawObject,
		//@ts-expect-error
		...this._update,
	};

	//@ts-expect-error
	this._update.loanWeightFactor = calculateLoanWeightFactor(rawObject.loanAmount, rawObject.interestRate);
	//@ts-expect-error
	this._update.apr = calculateAPR(
		rawObject.loanAmount,
		rawObject.term,
		rawObject.interestRate,
		rawObject.originationFee
	);

	if (rawObject.originationFee) {
		//@ts-expect-error
		this._update.totalOriginationFee = rawObject.loanAmount * (rawObject.originationFee / 100);
	}

	next();
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
