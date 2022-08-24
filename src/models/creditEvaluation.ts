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

	reportDate: Date;
	firstCreditAccount: string;
	monitoringService: string;
	state: string;
	ageOfFile: string;
	averageAgeOfOpenRevolvingCredit: string;
	loanPackageAmount: number;

	// creditScores: {};
	recentInquiries: {
		type: string;
	};
	// dregoatoryInformation: {};
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
});

const objectModel = model<ICreditEvaluation>('Credit Evaluation', creditEvaluationSchema);

export { ICreditEvaluation };
export default objectModel;
