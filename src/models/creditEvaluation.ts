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
	typeDetail: string;
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
	typeDetail: string;
};

// INCOMES
export enum CreditEvaluationIncomeTypeEnum {
	PAYSTUB = 'paystub',
	SELF_EMPLOYMENT = 'self-employment',
	ADDITIONAL_INCOME = 'additional-income',
	HOUSING_ALLOWANCE = 'housing-allowance',
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
	calculatedDeferredStudentLoans: number;
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
		source?: string;
		year: number;
		eoyExpected: number;
		type: CreditEvaluationIncomeTypeEnum;
	}[];
};

export enum CreditEvaluationIncomeOverviewEnum {
	STATED_INCOME = 'stated-income',
	INDIVIDUAL_INCOME_CURRENT_YEAR = 'individual-income-current-year',
	INDIVIDUAL_INCOME_PRIOR_YEAR = 'individual-income-prior-year',
	INDIVIDUAL_INCOME_2_YEAR_AVERAGE = 'individual-income-2-year-average',
	INDIVIDUAL_INCOME_3_YEAR_AVERAGE = 'individual-income-3-year-average',
	INDIVIDUAL_INCOME_STUDENT_LOAN_ADJUSTED = 'individual-income-student-loan-adjusted',
	INDIVIDUAL_INCOME_RENT_ADJUSTED = 'individual-income-rent-adjusted',
	INDIVIDUAL_INCOME_HALF_MORTGAGE = 'individual-income-half-mortgage',
	HOUSEHOLD_INCOME = 'household-income',
}

// INCOME OVERVIEW
export type CreditEvaluationIncomeOverview = {
	type: CreditEvaluationIncomeOverviewEnum;
	monthly: number;
	annual: number;
	dti: number;
};

export enum CreditEvaluationLoanAffordabilityEnum {
	SELECTED_INCOME = 'selected-income',
	AFFORDABILITY_INCLUDING_STUDENT_LOAN_DEBT = 'affordability-including-student-loan-debt',
	AFFORDABILITY_INCLUDING_RENT = 'affordability-including-rent',
	AFFORDABILITY_INCLUDING_RENT_AND_DEFERRED_STUDENT_LOANS = 'affordability-including-rent-and-deferred-student-loans',
	AFFRODABILITY_HALF_MORTAGE = 'affordability-half-mortgage',
	HOUSEHOLD_INCOME = 'household-income',
	HOUSEHOLD_AFFORDABILITY_INCLUDING_STUDENT_LOAN_DEBT = 'household-affordability-including-student-loan-debt',
	HOUSEHOLD_AFFORDABILITY_INCLUDING_RENT = 'household-affordability-including-rent',
	HOUSEHOLD_AFFORDABILITY_INCLUDING_RENT_AND_DEFERRED_STUDENT_LOANS = 'household-affordability-including-rent-and-deferred-student-loans',
}

// LOAN AFFORDABILITY
export type CreditEvaluationLoanAffordability = {
	source: CreditEvaluationLoanAffordabilityEnum;
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
	// ADDITIONAL
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

export type CreditEvaluationCollection = {
	dateVerified: Date;
	status: string;
	memberNumber: string;
	narrativesCreditorAccountNumber: string;
	industryCode: string;
	dateReported: Date;
	amount: number;
	balance: number;
	dateClosed: Date;
};

export type CreditEvaluationPublicRecords = {
	courtNumber: string;
	dateReported: Date;
	memberNumber: string;
	amount: number;
	recordType: string;
	datePaid: Date;
	plaintiff: string;
	assets: string;
	courtType: string;
	accDesignator: string;
	attorney: string;
	liability: number;
	publicRecordDisposition: string;
	docket: string;
	industry: string;
	origDate: Date;
};

export type CreditEvaluationLatePayments = {
	creditor: string;
	reportDate: Date;
	rating30: number;
	rating60: number;
	rating90: number;
	paymentPattern: string[];
};

export type CreditEvaluationChargeoffs = {
	creditor: string;
	reportDate: Date;
	chargeoff: number;
	pastdue: number;
};

export enum CreditEvaluationAffordabilityEnum {
	PENDING_EVAL = 'pending-eval',
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
}

interface ICreditEvaluation extends Document {
	customer: string;
	hubspotDealId: string;

	leadSource: string;
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
	statedMonthlyIncome: number;

	// Decline Reason Codes
	declineReasonCodes: string[];
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
	selectedHouseholdIncome?: CreditEvaluationIncomeOverviewEnum;
	// Loan Affordability
	loanAffordability: CreditEvaluationLoanAffordability[];
	loanAffordabilityRate: number;

	// Collections
	collections: CreditEvaluationCollection[];
	// Public Records
	publicRecords: CreditEvaluationPublicRecords[];
	// Late Payments
	latePayments: CreditEvaluationLatePayments[];
	// Chargeoffs
	chargeOffs: CreditEvaluationChargeoffs[];

	// Affordability
	affordability: CreditEvaluationAffordabilityEnum;
	// Notes
	notes: string;
	// Deal Status
	dealStatus: string;
}

const creditEvaluationSchema: Schema = new Schema(
	{
		customer: {
			type: Schema.Types.ObjectId,
			ref: 'Customer',
			required: true,
		},
		hubspotDealId: {
			type: String,
		},
		leadSource: {
			type: String,
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
		statedMonthlyIncome: {
			type: Number,
		},
		declineReasonCodes: [{ type: String }],
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
				typeDetail: {
					type: String,
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
				typeDetail: {
					type: String,
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
						// ADDITIONAL
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
			calculatedDeferredStudentLoans: {
				type: Number,
			},
			deferredStudentLoans: {
				type: Number,
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
		selectedHouseholdIncome: {
			type: String,
			enum: CreditEvaluationIncomeOverviewEnum,
		},
		// Loan Affordability
		loanAffordability: [
			{
				source: { type: String, enum: CreditEvaluationLoanAffordabilityEnum },
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
		loanAffordabilityRate: {
			type: Number,
			default: 14,
		},

		// Collections
		collections: [
			{
				dateVerified: Date,
				status: String,
				memberNumber: String,
				narrativesCreditorAccountNumber: String,
				industryCode: String,
				dateReported: Date,
				amount: Number,
				balance: Number,
				dateClosed: Date,
			},
		],
		// Public Records
		publicRecords: [
			{
				courtNumber: String,
				dateReported: Date,
				memberNumber: String,
				amount: Number,
				recordType: String,
				datePaid: Date,
				plaintiff: String,
				assets: String,
				courtType: String,
				accDesignator: String,
				attorney: String,
				liability: Number,
				publicRecordDisposition: String,
				docket: String,
				industry: String,
				origDate: Date,
			},
		],

		latePayments: [
			{
				creditor: String,
				reportDate: Date,
				rating30: Number,
				rating60: Number,
				rating90: Number,
				paymentPattern: [String],
			},
		],
		chargeOffs: [
			{
				creditor: String,
				reportDate: Date,
				chargeoff: Number,
				pastdue: Number,
			},
		],

		affordability: {
			type: String,
			enum: CreditEvaluationAffordabilityEnum,
			default: CreditEvaluationAffordabilityEnum.PENDING_EVAL,
		},
		notes: {
			type: String,
		},
		dealStatus: {
			type: String,
		},
	},

	{ timestamps: true }
);

creditEvaluationSchema.plugin(MongooseFindByReference);
const objectModel = model<ICreditEvaluation>('Credit Evaluation', creditEvaluationSchema);

export { ICreditEvaluation };
export default objectModel;
