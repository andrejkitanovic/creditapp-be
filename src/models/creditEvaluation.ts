import { Schema, model, Document } from 'mongoose';

type CreditEvaluationTradeline = {
	creditor: string;
	balance: number;
	payment: number;
	creditLimit: number;
	opened: Date;
	reportDate: Date;
	accountType: string;
	utilizationRate: string;
};

type CreditEvaluationLoan = {
	creditor: string;
	balance: number;
	payment: number;
	creditLimit: number;
	opened: Date;
	reportDate: Date;
	accountType: string;
	debitToCreditRatio: string;
	// paymentRatio: string;
};

interface ICreditEvaluation extends Document {
	customer: string;
	html: string;

	reportDate: Date;
	firstCreditAccount: string;
	monitoringService: string;
	state: string;
	ageOfFile: string;
	averageAgeOfOpenRevolvingCredit: string;
	loanPackageAmount: number;
	creditScores: {
		type: 'XPN';
		score: number;
	}[];
	recentInquiries: {
		type: 'XPN';
		lastSixMonths: number;
	}[];
	// dregoatoryInformation: {}[];
	tradelines: CreditEvaluationTradeline[];
	businessTradelines: CreditEvaluationTradeline[];
	loans: CreditEvaluationLoan[];
	// debtDetails: {};
	// income: {};
	// loanAffordabilityCalculator: {};
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
	reportDate: {
		type: Date,
	},
	firstCreditAccount: {
		type: String,
	},
	monitoringService: {
		type: String,
	},
	state: {
		type: String,
	},
	ageOfFile: {
		type: String,
	},
	averageAgeOfOpenRevolvingCredit: {
		type: String,
	},
	loanPackageAmount: {
		type: Number,
	},
	creditScores: [
		{
			type: {
				type: String,
				enum: ['XPN'],
			},
			score: {
				type: Number,
			},
		},
	],
	recentInquiries: [
		{
			type: {
				type: String,
				enum: ['XPN'],
			},
		},
	],
});

const objectModel = model<ICreditEvaluation>('Credit Evaluation', creditEvaluationSchema);

export { ICreditEvaluation };
export default objectModel;
