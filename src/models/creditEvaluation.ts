import { Schema, model, Document } from 'mongoose';
import { MongooseFindByReference } from 'mongoose-find-by-reference';

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

// DEBTS
export type CreditEvaluationDebtDetails = {
	debtPayment: number;
	deferredStudentLoans: number;
	rentPayment: number;
	totalDebtPayment: number;
	spouseIncome: number;
	spousalDebt: number;
	totalPayment: number;
	mortgagePayment: number;
};

// SUMMARY OF INCOMES
export type CreditEvaluationSummaryOfIncomes = {
	incomeSources: {
		startDate?: Date;
		year: number;
		eoyExpected: number;
		type: CreditEvaluationIncomeTypeEnum;
	}[];
	total: number;
};

/*
Current Income (from income table)
Current Income Debt Adjusted (from income table, with a negative monthly. debt modifier)
Current Income Student Loan Adjusted (from income table, with a negative monthly debt modifier)
Household Income (A modified annual income amount)
Household Income Debt Adjusted (A m modified annual income amount with a negative monthly debt modifier)
Household Income Student Loan Adjusted (A m modified annual income amount with a negative monthly debt modifier)
*/
export enum CreditEvaluationIncomeOverviewEnum {
	INDIVIDUAL_INCOME_CURRENT_YEAR = 'individual-income-current-year',
	INDIVIDUAL_INCOME_PRIOR_YEAR = 'individual-income-prior-year',
	INDIVIDUAL_INCOME_2_YEAR_AVERAGE = 'individual-income-2-year-average',
	INDIVIDUAL_INCOME_3_YEAR_AVERAGE = 'individual-income-3-year-average',
	INDIVIDUAL_INCOME_STUDENT_LOAN_ADJUSTED = 'individual-income-student-loan-adjusted',
	INDIVIDUAL_INCOME_RENT_ADJUSTED = 'individual-income-rent-adjusted',
	INDIVIDUAL_INCOME_HALF_MORTGAGE = 'individual-income-half-mortgage',
	HOUSEHOLD_INCOME = 'household-income'
}

// INCOME OVERVIEW
export type CreditEvaluationIncomeOverview = {
	type: CreditEvaluationIncomeOverviewEnum;
	monthly: number;
	annual: number;
	dti: number;
};

// LOAN AFFORDABILITY
export type CreditEvaluationLoanAffordability = {
	source: CreditEvaluationIncomeOverviewEnum;
	rate: number;
	dti: number;

	annualTotal: number;
	monthlyTotal: number;
	monthlyTotalWithDebt: number;

	term60: number;
	term72: number;
	term84: number;
	term120: number;
	term144: number;
};

export type CreditEvaluationIncomeSource = {
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
};

export type CreditEvaluationIncome = {
	type: CreditEvaluationIncomeTypeEnum;
	payStubs?: CreditEvaluationIncomePaystubsEnum;
	period?: string;
	averageCheckAmount?: number;
	averageCheckAmountBasedOnYTD?: number;
	incomeSources: CreditEvaluationIncomeSource[];
};

interface ICreditEvaluation extends Document {
	customer: string;
	// HTML and PDF
	html: string;
	pdf: string;
	reportDate: Date;
	firstCreditAccount: string;
	monitoringService: string;
	state: string;
	ageOfFile: Date;
	averageMonthsOfOpenRevolvingCredit: number;
	loanPackageAmount: number;
	// Credit Scores
	creditScores: {
		type: 'XPN';
		score: number;
	}[];
	// Inquires
	recentInquiries: {
		type: 'XPN';
		lastSixMonths: number;
		lastTwelveMonths: number;
		inquiries: {
			name: string;
			date: Date;
		}[];
	}[];
	// Tradelines
	tradelines: CreditEvaluationTradeline[];
	// Loans
	loans: CreditEvaluationLoan[];
	// Incomes
	incomes: CreditEvaluationIncome[];
	// Debt Details
	debtDetails: CreditEvaluationDebtDetails;
	// Summary of Incomes
	summaryOfIncomes: CreditEvaluationSummaryOfIncomes;
	// Income Overview
	incomesOverview: CreditEvaluationIncomeOverview[];
	// Loan Affordability
	loanAffordability: CreditEvaluationLoanAffordability[];
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
				inquiries: [
					{
						name: {
							type: String,
						},
						date: {
							type: Date,
						},
					},
				],
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
				hpb: {
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
				hpb: {
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
			},
		],
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
		debtDetails: {
			debtPayment: {
				type: Number,
				default: 0,
			},
			deferredStudentLoans: {
				type: Number,
				default: 0,
			},
			rentPayment: {
				type: Number,
				default: 0,
			},
			totalDebtPayment: {
				type: Number,
				default: 0,
			},
			spouseIncome: {
				type: Number,
				default: 0,
			},
			spousalDebt: {
				type: Number,
			},
			totalPayment: {
				type: Number,
				default: 0,
			},
			mortgagePayment: {
				type: Number,
				default: 0,
			},
		},
		summaryOfIncomes: {
			incomeSources: [
				{
					year: {
						type: Number,
					},
					eoyExpected: {
						type: Number,
					},
					type: { type: String, enum: CreditEvaluationIncomeTypeEnum },
				},
			],
			total: {
				type: Number,
			},
		},
		// Income Overview
		incomesOverview: [
			{
				type: { type: String, enum: CreditEvaluationIncomeOverviewEnum },
				monthly: { type: Number },
				annual: { type: Number },
				dti: { type: Number },
			},
		],
		// Loan Affordability
		loanAffordability: [
			{
				source: { type: String, enum: CreditEvaluationIncomeOverviewEnum },
				rate: { type: Number },
				dti: { type: Number },

				annualTotal: { type: Number },
				monthlyTotal: { type: Number },
				monthlyTotalWithDebt: { type: Number },

				term60: { type: Number },
				term72: { type: Number },
				term84: { type: Number },
				term120: { type: Number },
				term144: { type: Number },
			},
		],
	},

	{ timestamps: true }
);

creditEvaluationSchema.plugin(MongooseFindByReference);
const objectModel = model<ICreditEvaluation>('Credit Evaluation', creditEvaluationSchema);

export { ICreditEvaluation };
export default objectModel;
