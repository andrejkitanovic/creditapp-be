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

type CreditEvaluationDebtDetails = {
	debtPayment: number;
	defferedStudentLoans: number;
	rentPayment: number;
	totalIndividualPayment: number;
	totalSpousalPayment: number;
	totalHouseholdPayment: number;
};

type CreditEvaluationIncome = {
	individual: {
		monthly: number;
		annual: number;
		debtToIncome: number;
	};
	household: {
		monthly: number;
		annual: number;
		debtToIncome: number;
	};
};

interface ICreditEvaluation extends Document {
	customer: string;
	html: string;

	reportDate: Date;
	firstCreditAccount: string;
	monitoringService: string;
	state: string;
	ageOfFile: Date;
	averageMonthsOfOpenRevolvingCredit: number;
	loanPackageAmount: number;
	creditScores: {
		type: 'XPN';
		score: number;
	}[];
	recentInquiries: {
		type: 'XPN';
		lastSixMonths: number;
		lastTwelveMonths: number;
	}[];
	// dregoatoryInformation: {}[];
	tradelines: CreditEvaluationTradeline[];
	businessTradelines: CreditEvaluationTradeline[];
	loans: CreditEvaluationLoan[];
	debtDetails: CreditEvaluationDebtDetails;
	income: CreditEvaluationIncome;
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
		type: Date,
	},
	averageMonthsOfOpenRevolvingCredit: {
		type: Number,
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
			lastSixMonths: {
				type: Number,
			},
			lastTwelveMonths: {
				type: Number,
			},
		},
	],
	tradelines: [
		{
			creditor: {
				type: String,
			},
			balance: {
				type: Number,
			},
			payment: {
				type: Number,
			},
			creditLimit: {
				type: Number,
			},
			opened: {
				type: Date,
			},
			reportDate: {
				type: Date,
			},
			accountType: {
				type: String,
			},
			utilizationRate: {
				type: String,
			},
		},
	],
});

const objectModel = model<ICreditEvaluation>('Credit Evaluation', creditEvaluationSchema);

export { ICreditEvaluation };
export default objectModel;
