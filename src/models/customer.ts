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
	social?: string; // TO CHECK
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

		placeOfBirth?: string;
		bornInDifferentCountry?: boolean;
		USResident?: boolean;
		loanEmail?: string;
		mothersMaidenName?: string;
		highSchoolMascot?: string;
		highSchoolCity?: string;
		nameOfStreet?: string;
		nameOfPet?: string;
		rentOrOwn?: 'rent' | 'own';
		monthlyHomeCost?: number;
		moveInDate?: Date;
		personalMonthlyIncome?: number;
		householdAnnualIncome?: number;
		fraudAlerts?: boolean;
		numberOfFraudAlerts?: number;
		maritialStatus?: string;
		bankruptcy?: boolean;
	};

	// Housing Information
	housingInfo: {
		houstingStatus?: string;
		monthlyHousingPayment?: number;
		estimatedLengthOfTimeAtResidence?: number;
		moveInDate?: Date;
		calculatedLengthOfTimeAtResidence?: number;
		yearsAtCurrentAddress?: number;
	};

	// Employment Information
	employmentInfo: {
		incomeType?: string;
		employerName?: string;
		employerPhone?: string;
		employerAddress?: string;

		startDate?: Date;
		jobTitle?: string;
		earnIncomeYearRound?: number;
	};
	
	// Security Questions

	// Education Information
	educationInfo: {
		collegeAttended?: string;
		fieldOfStudy?: string;
		degree?: string;
		graduatedDate?: Date;
		graduateSchoolAttended?: string;
		graduateSchoolFieldOfStudy?: string;
		graduateDegreeReceived?: string;
	};

	// Asset Information
	assetInfo: {
		bankBalance?: number;
		investmentBalance?: number;
		cryptoBalance?: number;
		retirementBalance?: number;
		avmValue?: number;
		marketValue?: number;
		zillowValue?: number;
		estimatedEquity?: number;
		estimatedValue?: number;
		realEquity?: number;
	};
	// Primary Residence Valuation

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
		firstName: {
			type: String,
			required: true,
		},
		middleName: String,
		lastName: {
			type: String,
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
		phone: String,
		social: {
			type: String,
		},
		email: {
			type: String,
			required: true,
		},
		birthday: {
			type: Date,
			required: true,
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
		personalInfo: {
			placeOfBirth: String,
			bornInDifferentCountry: Boolean,
			USResident: Boolean,
			loanEmail: String,
			mothersMaidenName: String,
			highSchoolMascot: String,
			highSchoolCity: String,
			nameOfStreet: String,
			nameOfPet: String,
			driversLicenseId: String,
			driversLicenseIssueDate: Date,
			driversLicenseExpireDate: Date,
			rentOrOwn: {
				type: String,
				enum: ['rent', 'own'],
			},
			monthlyHomeCost: Number,
			moveInDate: Date,
			personalMonthlyIncome: Number,
			householdAnnualIncome: Number,
			creditUnion: String,
			personalBank: String,
			militaryStatus: String,
			fraudAlerts: Boolean,
			numberOfFraudAlerts: Number,
			maritialStatus: String,
			creditRepairBefore: Boolean,
			bankRoutingNumber: String,
			bankAccountNumber: String,
			bankruptcy: Boolean,
			previoiusFinanceCompany: Boolean,
		},
		educationInfo: {
			collegeAttended: String,
			fieldOfStudy: String,
			degree: String,
			graduatedDate: Date,
		},
		employmentInfo: {
			employerName: String,
			employerPhone: String,
			employerAddress: String,
			startDate: Date,
			jobTitle: String,
			earnIncomeYearRound: Number,
		},
		assetInfo: {
			bankBalance: Number,
			investmentBalance: Number,
			cryptoBalance: Number,
			retirementBalance: Number,
			avmValue: Number,
			marketValue: Number,
			zillowValue: Number,
			estimatedEquity: Number,
			estimatedValue: Number,
			realEquity: Number,
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
