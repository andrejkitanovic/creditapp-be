import { Schema, model, Document } from 'mongoose';

// TRADELINES
type CreditEvaluationTradeline = {
	status: 'opened' | 'closed';
	creditor: string;
	balance: number;
	payment: number;
	hpb: number;
	creditLimit: number;
	opened: Date;
	reportDate: Date;
	accountType: string;
	utilizationRate: number;
};

// LOANS
type CreditEvaluationLoan = {
	status: 'opened' | 'closed';
	creditor: string;
	balance: number;
	payment: number;
	hpb: number;
	limit: number;
	opened: Date;
	reportDate: Date;
	accountType: string;
	debitToCreditRatio: string;

	paydown75: number;
	paydown60: number;
};

// DEBTS
type CreditEvaluationDebtDetails = {
	debtPayment: number;
	// defferedStudentLoans: number;
	// rentPayment: number;
	// totalDebtPayment: number;
	// spousalDebt: number;
	// totalPayment: number;
};

// INCOMES
export enum CreditEvaluationIncomeTypeEnum {
	PAYSTUB = 'paystub',
	SELF_EMPLOYMENT = 'self-employment',
	RETIREMENT_INCOME = 'retirement-income',
}

export enum CreditEvaluationIncomePeriodsEnum {
	WEEKLY = 'weekly',
	BIWEEKLY = 'bi-weekly',
	MONTHLY = 'mothly',
	QUARTERLY = 'quarterly',
	BIMONTHLY = 'bi-monthly',
	ANNUAL = 'annual',
}

export enum CreditEvaluationIncomePaystubsEnum {
	'weekly' = 52,
	'bi-weekly' = 26,
	'monthly' = 12,
	'quarterly' = 4,
	'bi-monthly' = 24,
	'annual' = 1,
}

export type CreditEvaluationIncome = {
	type: CreditEvaluationIncomeTypeEnum;
	payStubs?: CreditEvaluationIncomePaystubsEnum;
	period?: string;
	averageCheckAmount?: number;
	averageCheckAmountBasedOnYTD?: number;
	incomeSources: {
		date: Date;
		// PAYSTUB
		amount?: number;
		ytd?: number;
		averageAnnual?: number;
		numberOfPeriodsToDate?: number;
		avgPerPeriod?: number;
		averageAnnual2?: number;
		numberOfPeriodsRemaining?: number;
		amountOfPayRemaining?: number;
		endOfYearExpectedIncome?: number;
		// SELF EMPLOYMENT
		grossRevenue?: number;
		netProfit?: number;
		percentageOfProfit?: number;
		averageMonthlyGrossRevenue?: number;
		yearOverYearGrossGrowth?: number;
		averageMonthlyNetProfit?: number;
		yearOverYearNetGrowth?: number;
		annualWages?: number;
		mothlyWage?: number;
		// RETIREMENT
		source?: string;
		monthlyBenefit?: number;
		previousIncomes?: {
			year: number;
			yearIncome: number;
			months: number;
		}[];
	}[];
};

interface ICreditEvaluation extends Document {
	customer: string;
	html: string;
	pdf: string;

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
	incomes: CreditEvaluationIncome[];
	// loanAffordabilityCalculator: {};
}

const creditEvaluationSchema: Schema = new Schema(
	{
		customer: {
			type: Schema.Types.ObjectId,
			ref: 'Customer',
			required: true,
		},
		html: {
			type: String,
		},
		pdf: {
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
				status: {
					type: String,
					enum: ['closed', 'opened'],
				},
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
					type: Number,
				},
			},
		],
		loans: [
			{
				status: {
					type: String,
					enum: ['closed', 'opened'],
				},
				creditor: {
					type: String,
				},
				balance: {
					type: Number,
				},
				payment: {
					type: Number,
				},
				limit: {
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
				debitToCreditRatio: {
					type: Number,
				},
				paydown75: {
					type: Number,
				},
				paydown60: {
					type: Number,
				},
			},
		],
		debtDetails: {
			debtPayment: {
				type: Number,
			},
		},
		incomes: [
			{
				type: { type: String, enum: CreditEvaluationIncomeTypeEnum },
				payStubs: { type: String, enum: CreditEvaluationIncomePaystubsEnum },
				period: { type: String, enum: CreditEvaluationIncomePeriodsEnum },
				averageCheckAmount: { type: Number },
				averageCheckAmountBasedOnYTD: { type: Number },
				incomeSources: [
					{
						date: { type: Date },
						// PAYSTUB
						amount: { type: Number },
						ytd: { type: Number },
						averageAnnual: { type: Number },
						numberOfPeriodsToDate: { type: Number },
						avgPerPeriod: { type: Number },
						averageAnnual2: { type: Number },
						numberOfPeriodsRemaining: { type: Number },
						amountOfPayRemaining: { type: Number },
						endOfYearExpectedIncome: { type: Number },
						// SELF EMPLOYMENT
						grossRevenue: { type: Number },
						netProfit: { type: Number },
						percentageOfProfit: { type: Number },
						averageMonthlyGrossRevenue: { type: Number },
						yearOverYearGrossGrowth: { type: Number },
						averageMonthlyNetProfit: { type: Number },
						yearOverYearNetGrowth: { type: Number },
						annualWages: { type: Number },
						mothlyWage: { type: Number },
						// RETIREMENT
						source: { type: String },
						monthlyBenefit: { type: Number },
						previousIncomes: [
							{
								year: { type: Number },
								yearIncome: { type: Number },
								months: { type: Number },
							},
						],
					},
				],
			},
		],
	},
	{ timestamps: true }
);

const objectModel = model<ICreditEvaluation>('Credit Evaluation', creditEvaluationSchema);

export { ICreditEvaluation };
export default objectModel;
