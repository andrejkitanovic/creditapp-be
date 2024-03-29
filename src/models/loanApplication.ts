import { Schema, model, Document } from 'mongoose';
import { calculateAPR, calculateLoanWeightFactor } from 'utils/loans/loansCalculations';

export enum LoanApplicationStatus {
	APPLICATION_PENDING_SUBMISSION = 'application-pending-submission',
	APPLICATION_SUBMITTED = 'application-submitted',
	APPLICATION_DOCUMENTS_REQUIRED = 'application-documents-required',
	LOAN_APPROVED = 'loan-approved',
	APPROVED_NOT_TAKEN = 'approved-note-taken',
	LOAN_FUNDED = 'loan-funded',
	LOAN_DECLINED = 'loan-declined',
	CANCEL_PROCESS = 'cancel-process',
}

export enum LoanApplicationAccountType {
	AUTO_LEASE_INDIVIDUAL = 'auto-lease-individual',
	AUTO_LEASE_JOINT = 'auto-lease-joint',
	AUTO_LOAN_INDIVIDUAL = 'auto-loan-individual',
	AUTO_LOAN_JOINT = 'auto-loan-joint',
	CHILD_SUPPORT = 'child-support',
	BUSINESS_LOAN_PERSONALLY_GUARANTEED = 'business-loan-personally-guaranteed',
	HELOAN_INDIVIDUAL = 'heloan-individual',
	HELOAN_JOINT = 'heloan-joint',
	HELOC_INDIVIDUAL = 'heloc-individual',
	HELOC_JOINT = 'heloc-joint',
	HOME_IMPROVEMENT_LOAN_INDIVIDUAL = 'home-improvement-loan-individual',
	HOME_IMPROVEMENT_LOAN_JOINT = 'home-improvement-loan-joint',
	INSTALLMENT_SALES_CONTRACT = 'installement-sales-contract',
	MOBILE_HOME_INDIVIDUAL = 'mobile-home-individual',
	MOBILE_HOME_JOINT = 'mobile-home-joint',
	MORTGAGE_FIRST_INDIVIDUAL = 'mortgate-first-individual',
	MORTGAGE_FIRST_JOINT = 'mortgate-first-joint',
	MORTGAGE_SECOND_INDIVIDUAL = 'mortgate-second-individual',
	MORTGAGE_SECOND_JOINT = 'mortgate-second-joint',
	RECREATIONAL_VEHICLE_INDIVIDUAL = 'recreational-vehicle-individual',
	RECREATIONAL_VEHICLE_JOINT = 'recreational-vehicle-joint',
	RENTAL_AGREEMENT = 'rental-agreement',
	SECURED_LOAN_INDIVIDUAL = 'secured-loan-individual',
	SECURED_LOAN_JOINT = 'secured-loan-joint',
	STUDENT_LOAN_INDIVIDUAL = 'student-loan-individual',
	STUDENT_LOAN_JOINT = 'student-loan-joint',
	TIME_SHARE_LOAN_INDIVIDUAL = 'time-share-loan-individual',
	TIME_SHARE_LOAN_JOINT = 'time-share-loan-joint',
	UNSECURED_LOAN_INDIVIDUAL = 'unsecured-loan-individual',
	UNSECURED_LOAN_JOINT = 'unsecured-loan-joint',
	UTILITY_SELF_REPORTED = 'utility-self-reported',
}

export enum LoanApplicationCreditInquiry {
	EXPERIAN = 'XPN',
	TRANSUNION = 'TU',
	EQUIFAX = 'EXF',
	TRI_MERGE = 'TM',
	SOFT_PULL = 'SP',
}

interface ILoanApplication extends Document {
	customer: string;
	creditEvaluation: string;
	hubspotId?: string;
	leadSource: string;

	name: string;
	lenderId: string;
	lender: string;
	loanAmount: number;
	monthlyPayment: number;
	term: number;
	creditInquiry: LoanApplicationCreditInquiry[];
	applicationDate: Date;
	status: LoanApplicationStatus;
	accountType: LoanApplicationAccountType;
	interestRate: number;
	loanWeightFactor: number;
	originationFee: number;
	originationFeePercentage: number;
	apr: number;
	reasonCode: string;
	upToDate: boolean;
}

const loanApplicationSchema: Schema = new Schema({
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
	leadSource: {
		type: String,
	},
	name: {
		type: String,
	},
	lenderId: {
		type: String,
		required: true,
	},
	lender: {
		type: String,
		required: true,
	},
	loanAmount: {
		type: Number,
		required: true,
		default: 0,
	},
	monthlyPayment: {
		type: Number,
		required: true,
		default: 0,
	},
	term: {
		type: Number,
		required: true,
		default: 0,
	},
	creditInquiry: [
		{
			type: String,
			enum: LoanApplicationCreditInquiry,
			required: true,
		},
	],
	applicationDate: {
		type: Date,
		required: true,
	},
	status: {
		type: String,
		required: true,
	},
	accountType: {
		type: String,
		required: true,
	},
	interestRate: {
		type: Number,
		required: true,
		default: 0,
	},
	loanWeightFactor: {
		type: Number,
		required: true,
	},
	originationFee: {
		type: Number,
		default: 0,
	},
	originationFeePercentage: {
		type: Number,
	},
	apr: {
		type: Number,
	},
	reasonCode: {
		type: String,
		required: true,
	},
	upToDate: {
		type: Boolean,
		default: false,
	},
});

loanApplicationSchema.pre('findOneAndUpdate', async function (next) {
	//@ts-expect-error
	let rawObject = await this.findOne({ _id: this._conditions._id }).lean().clone();
	rawObject = {
		...rawObject,
		//@ts-expect-error
		...this._update,
	};

	//@ts-expect-error
	this._update.loanWeightFactor = calculateLoanWeightFactor(rawObject.loanAmount, rawObject.interestRate);
	if (!rawObject.apr) {
		//@ts-expect-error
		this._update.apr = calculateAPR(
			rawObject.loanAmount,
			rawObject.term,
			rawObject.interestRate,
			rawObject.originationFee
		);
	}

	next();
});
loanApplicationSchema.pre('validate', function (next) {
	this.loanWeightFactor = calculateLoanWeightFactor(this.loanAmount, this.interestRate);
	this.apr = calculateAPR(this.loanAmount, this.term, this.interestRate, this.originationFee);

	next();
});
const objectModel = model<ILoanApplication>('Loan Application', loanApplicationSchema);

export { ILoanApplication };
export default objectModel;
