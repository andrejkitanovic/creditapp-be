import { Schema, model, Document } from 'mongoose';

interface IDealLoanPackage extends Document {
	customer: string;
	hubspotId?: string;

	originalTotalAmount: number;
	dateOfApplication: Date;
	individualTotalDebtPayment: number;
	householdTotalDebtPayment: number;
	individualDebtToIncome: number;
	householdDebtToIncome: number;
	successFee: number;
	totalAcceptedLoans: number;
}

const dealLoanPackageSchema: Schema = new Schema({
	customer: {
		type: Schema.Types.ObjectId,
		ref: 'Customer',
		required: true,
	},
	hubspotId: {
		type: String,
	},
	
	originalTotalAmount: {
		type: Number,
		required: true,
	},
	dateOfApplication: {
		type: Date,
		required: true,
	},
	individualTotalDebtPayment: {
		type: Number,
		required: true,
	},
	householdTotalDebtPayment: {
		type: Number,
		required: true,
	},
	individualDebtToIncome: {
		type: Number,
		required: true,
	},
	householdDebtToIncome: {
		type: Number,
		required: true,
	},
	successFee: {
		type: Number,
		required: true,
	},
	totalAcceptedLoans: {
		type: Number,
		required: true,
	},
});

const objectModel = model<IDealLoanPackage>('Deal Loan Package', dealLoanPackageSchema);

export { IDealLoanPackage };
export default objectModel;
