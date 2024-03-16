import { hsUpdateContact } from 'controllers/hubspot';
import { Schema, model, Document } from 'mongoose';

// Income
export enum CustomerIncomeTypeEnum {
	PAYSTUB = 'paystub',
	SELF_EMPLOYMENT = 'self-employment',
	ADDITIONAL_INCOME = 'additional-income',
	HOUSING_ALLOWANCE = 'housing-allowance',
}

export enum CustomerIncomePeriodsEnum {
	WEEKLY = 'weekly',
	BIWEEKLY = 'bi-weekly',
	MONTHLY = 'mothly',
	QUARTERLY = 'quarterly',
	BIMONTHLY = 'bi-monthly',
	ANNUAL = 'annual',
}

export enum CustomerIncomePaystubsEnum {
	'weekly' = 52,
	'bi-weekly' = 26,
	'monthly' = 12,
	'quarterly' = 4,
	'bi-monthly' = 24,
	'annual' = 1,
}

export type CustomerIncomeSource = {
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

export type CustomerIncome = {
	type: CustomerIncomeTypeEnum;
	payStubs?: CustomerIncomePaystubsEnum;
	period?: CustomerIncomePeriodsEnum;
	averageCheckAmount?: number;
	averageCheckAmountBasedOnYTD?: number;
	incomeSources: CustomerIncomeSource[];
};

interface ICustomer extends Document {
	hubspotId?: string;
	// Spouse
	spouse?: string;

	// General Information
	firstName: string;
	middleName?: string;
	lastName: string;
	salutation: string;
	email: string;
	social?: string;
	birthday: Date;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
	phone?: string;
	mobilePhone?: string;

	// Additional
	associatedBrand?: string;
	referralSource?: string;
	leadSource?: string;
	franchiseChoice?: string;

	// Personal Information
	personalInfo: {
		driversLicenseId?: string;
		driversLicenseIssueDate?: Date;
		driversLicenseExpireDate?: Date;
		creditUnion?: string;
		personalBank?: string;
		militaryStatus?: string;
		militaryAffiliation?: string;
		bankRoutingNumber?: string;
		bankAccountNumber?: string;
		creditRepairBefore?: boolean;
		judgementsLiensBankruptcy?: string;
		previoiusFinanceCompany?: boolean;
		maritalStatus?: string;
		businessBank?: string;
		businessBankRoutingNumber?: string;
		businessBankAccountNumber?: string;
		fraudAlert?: boolean;
		numberOfFraudAlert?: string;
	};

	// Housing Information
	housingInfo: {
		houstingStatus?: string;
		monthlyHousingPayment?: number;
		estimatedLengthOfTimeAtResidence?: string;
		moveInDate?: Date;
		calculatedLengthOfTimeAtResidence?: string;
		yearsAtCurrentAddress?: string;
	};

	// Employment Information
	employmentInfo: {
		incomeType?: string;
		employerName?: string;
		employerPhone?: string;
		employerAddress?: string;
		estimatedTimeAtJob?: string;
		startDateWithEmployer?: Date;
		calculatedLengthOfEmployment?: string;
		occupationPosition?: string;
		monthlyGrossIncome?: number;
		annualPersonalIncome?: number;
		frontEndRtiRatio?: number;
		totalAnnualHouseholdIncome?: number;
		householdFrontEndDtiRatio?: number;
		statedMonthlyIncome?: number;
		statedAnnualIncome?: number;
		statedAnnualHouseholdIncome?: number;
	};

	// Security Questions
	securityQuestions: {
		birthCity?: string;
		bronInForeignCountry?: boolean;
		legalPermanentResident?: boolean;
		greenCardExpirationDate?: string;
		mothersMaidenName?: string;
		highSchoolMascot?: string;
		highSchoolCity?: string;
		nameOfStreetYouGrewUp?: string;
		favoritePetsName?: string;
	};

	// Education Information
	educationInfo: {
		collegeAttended?: string;
		fieldOfStudy?: string;
		degree?: string;
		graduatedDate?: Date;
		graduateSchoolAttended?: string;
		graduateSchoolFieldOfStudy?: string;
		graduateDegreeReceived?: string;
		graduateGraduationDate?: Date;
	};

	// Asset Information
	assetInfo: {
		combinedCheckingSavingsBalance?: number;
		stocksBondsMutualFunds?: number;
		retirementAccountBalance?: number;
	};

	// Primary Residence Valuation
	primaryResidenceValuation: {
		avmValue?: number;
		marketValue?: number;
		zillowValue?: number;
		estimatedPropertyValue?: number;
		estimatedEquityPrimaryResidence?: number;
		calculatedValue?: number;
		calculatedEquity?: number;
	};

	// Submission
	submissionEmail?: string;
	submissionPassword?: string;

	cbcErrorMessage?: string;

	// Incomes
	incomes: CustomerIncome[];
}

const customerSchema: Schema = new Schema(
	{
		hubspotId: {
			type: String,
		},
		spouse: {
			type: Schema.Types.ObjectId,
			ref: 'Customer',
		},
		// General Information
		firstName: {
			type: String,
			required: true,
		},
		middleName: String,
		lastName: {
			type: String,
			required: true,
		},
		salutation: {
			type: String,
		},
		email: {
			type: String,
			required: true,
		},
		social: {
			type: String,
		},
		birthday: {
			type: Date,
			required: true,
		},
		address: {
			type: String,
		},
		city: {
			type: String,
		},
		state: {
			type: String,
		},
		zip: {
			type: String,
		},
		phone: {
			type: String,
		},
		mobilePhone: {
			type: String,
		},

		associatedBrand: {
			type: String,
		},
		referralSource: {
			type: String,
		},
		leadSource: {
			type: String,
		},
		franchiseChoice: {
			type: String,
		},

		// Personal Information
		personalInfo: {
			driversLicenseId: String,
			driversLicenseIssueDate: Date,
			driversLicenseExpireDate: Date,
			creditUnion: String,
			personalBank: String,
			militaryStatus: String,
			militaryAffiliation: String,
			bankRoutingNumber: String,
			bankAccountNumber: String,
			creditRepairBefore: Boolean,
			judgementsLiensBankruptcy: String,
			previoiusFinanceCompany: Boolean,
			maritalStatus: String,
			businessBank: String,
			businessBankRoutingNumber: String,
			businessBankAccountNumber: String,
			fraudAlert: Boolean,
			numberOfFraudAlert: String,
		},

		// Housing Information
		housingInfo: {
			houstingStatus: String,
			monthlyHousingPayment: Number,
			estimatedLengthOfTimeAtResidence: String,
			moveInDate: Date,
			calculatedLengthOfTimeAtResidence: String,
			yearsAtCurrentAddress: String,
		},

		// Employment Information
		employmentInfo: {
			incomeType: String,
			employerName: String,
			employerPhone: String,
			employerAddress: String,
			estimatedTimeAtJob: String,
			startDateWithEmployer: Date,
			calculatedLengthOfEmployment: String,
			occupationPosition: String,
			monthlyGrossIncome: Number,
			annualPersonalIncome: Number,
			frontEndRtiRatio: Number,
			totalAnnualHouseholdIncome: Number,
			householdFrontEndDtiRatio: Number,
			statedMonthlyIncome: Number,
			statedAnnualIncome: Number,
			statedAnnualHouseholdIncome: Number,
		},

		// Security Questions
		securityQuestions: {
			birthCity: String,
			bronInForeignCountry: Boolean,
			legalPermanentResident: Boolean,
			greenCardExpirationDate: String,
			mothersMaidenName: String,
			highSchoolMascot: String,
			highSchoolCity: String,
			nameOfStreetYouGrewUp: String,
			favoritePetsName: String,
		},

		// Education Information
		educationInfo: {
			collegeAttended: String,
			fieldOfStudy: String,
			degree: String,
			graduatedDate: Date,
			graduateSchoolAttended: String,
			graduateSchoolFieldOfStudy: String,
			graduateDegreeReceived: String,
			graduateGraduationDate: Date,
		},

		// Asset Information
		assetInfo: {
			combinedCheckingSavingsBalance: Number,
			stocksBondsMutualFunds: Number,
			retirementAccountBalance: Number,
		},

		// Primary Residence Valuation
		primaryResidenceValuation: {
			avmValue: Number,
			marketValue: Number,
			zillowValue: Number,
			estimatedPropertyValue: Number,
			estimatedEquityPrimaryResidence: Number,
			calculatedValue: Number,
			calculatedEquity: Number,
		},

		submissionEmail: {
			type: String,
		},
		submissionPassword: {
			type: String,
		},

		cbcErrorMessage: {
			type: String,
		},

		// Incomes
		incomes: [
			{
				type: { type: String, enum: CustomerIncomeTypeEnum },
				payStubs: { type: String, enum: CustomerIncomePaystubsEnum },
				period: { type: String, enum: CustomerIncomePeriodsEnum },
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
	},
	{ timestamps: true }
);

customerSchema.post('findOneAndUpdate', async function () {
	// @ts-expect-error
	const customer = await this.findOne({ _id: this._conditions._id }).clone();

	if (customer?.hubspotId) {
		await hsUpdateContact(customer.hubspotId, customer);
	}
});
const objectModel = model<ICustomer>('Customer', customerSchema);

export { ICustomer };
export default objectModel;
