import { Schema, model, Document } from 'mongoose';

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

	// Personal Information
	personalInfo: {
		driversLicenseId?: string;
		driversLicenseIssueDate?: Date;
		driversLicenseExpireDate?: Date;
		creditUnion?: string;
		personalBank?: string;
		militaryStatus?: string;
		bankRoutingNumber?: string;
		bankAccountNumber?: string;
		creditRepairBefore?: boolean;
		judgementsLiensBankruptcy?: string;
		previoiusFinanceCompany?: boolean;
		maritalStatus?: string;
		businessBank?: string;
		businessBankRoutingNumber?: string;
		businessBankAccountNumber?: string;
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
		calculatedValue?: number;
		calculatedEquity?: number;
	};

	cbcErrorMessage?: string;
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

		// Personal Information
		personalInfo: {
			driversLicenseId: String,
			driversLicenseIssueDate: Date,
			driversLicenseExpireDate: Date,
			creditUnion: String,
			personalBank: String,
			militaryStatus: String,
			bankRoutingNumber: String,
			bankAccountNumber: String,
			creditRepairBefore: Boolean,
			judgementsLiensBankruptcy: String,
			previoiusFinanceCompany: Boolean,
			maritalStatus: String,
			businessBank: String,
			businessBankRoutingNumber: String,
			businessBankAccountNumber: String,
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
			calculatedValue: Number,
			calculatedEquity: Number,
		},

		cbcErrorMessage: {
			type: String,
		},
	},
	{ timestamps: true }
);

const objectModel = model<ICustomer>('Customer', customerSchema);

export { ICustomer };
export default objectModel;
