import { Schema, model, Document } from 'mongoose';
import { CBCRequestTypeEnum } from 'controllers/cbc';

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

interface ILoanApplication extends Document {
	customer: string;
	creditEvalution: string;
	// hubspotId?: string;

	lender: string;
	loanAmount: number;
	monthlyPayment: number;
	term: number;
	creditInquiry: CBCRequestTypeEnum;
	applicationDate: Date;
	status: LoanApplicationStatus;
	accountType: LoanApplicationAccountType;
	interestRate: number;
	loanWeightFactor: number;
	originationFee: number;
	reasonCode: string;
	apr: number;
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
		ref: 'Customer',
		required: true,
	},
	// hubspotId: {
	// 	type: String,
	// },

	lender: {
		type: String,
		required: true,
	},
	loanAmount: {
		type: Number,
		required: true,
	},
	monthlyPayment: {
		type: Number,
		required: true,
	},
	term: {
		type: Number,
		required: true,
	},
	creditInquiry: {
		type: String,
		enum: CBCRequestTypeEnum,
		required: true,
	},
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
	},
	loanWeightFactor: {
		type: Number,
		required: true,
	},
	originationFee: {
		type: Number,
		required: true,
	},
	reasonCode: {
		type: String,
		required: true,
	},
	apr: {
		type: Number,
		required: true,
	},
	upToDate: {
		type: Boolean,
		default: false,
	},
});

const calculateAPR = (loanAmount: number, term: number, interestRate: number, originationFee: number) => {
	/* 
	loanAmount 	= the amount borrowed
	term	= number of monthly payments e.g. 30 years = 360
	interestRate	= the base percentage rate of the loan. A 5.25% Annual Rate should be passed in as 0.0525 NOT 5.25
	originationFee		= the loan closing costs e.g. origination fee, broker fees, etc.
	*/

	const rate = interestRate / 12;
	const totalmonthlypayment =
		((loanAmount + originationFee) * rate * Math.pow(1 + rate, term)) / (Math.pow(1 + rate, term) - 1);
	let testrate = rate;
	let iteration = 1;
	let testresult = 0;

	// Iterate until result = 0
	let diff = testrate;
	while (iteration <= 100) {
		testresult =
			(testrate * Math.pow(1 + testrate, term)) / (Math.pow(1 + testrate, term) - 1) - totalmonthlypayment / loanAmount;
		if (Math.abs(testresult) < 0.0000001) break;
		if (testresult < 0) testrate += diff;
		else testrate -= diff;
		diff = diff / 2;
		iteration++;
	}
	testrate = testrate * 12;
	return testrate.toFixed(6);
};

loanApplicationSchema.pre('validate', function (next) {
	this.loanWeightFactor = this.loanAmount * this.interestRate;
	this.apr = calculateAPR(this.loanAmount, this.term, this.interestRate, this.originationFee);
	next();
});
const objectModel = model<ILoanApplication>('Loan Application', loanApplicationSchema);

export { ILoanApplication };
export default objectModel;
