import { Schema, model, Document } from 'mongoose';

interface ICustomer extends Document {
	hubspotId?: string;
	firstName: string;
	lastName: string;
	middleName?: string;
	address?: string;
	city?: string;
	state?: string;
	zip?: string;
	phone?: string;
	social?: string; // TO CHECK
	email: string;
	birthday: Date;
	referralPartner?: string;
	associatedBrand?: string;
	personalInfo: {
		placeOfBirth?: string;
		bornInDifferentCountry?: boolean;
		USResident?: boolean;
		loanEmail?: string;
		mothersMaidenName?: string;
		highSchoolMascot?: string;
		highSchoolCity?: string;
		nameOfStreet?: string;
		nameOfPet?: string;
		driversLicenseId?: string;
		driversLicenseIssueDate?: Date;
		driversLicenseExpireDate?: Date;
		rentOrOwn?: 'rent' | 'own';
		monthlyHomeCost?: number;
		moveInDate?: Date;
		personalMonthlyIncome?: number;
		householdAnnualIncome?: number;
		creditUnion?: string;
		personalBank?: string;
		militaryStatus?: string;
		fraudAlerts?: boolean;
		numberOfFraudAlerts?: number;
		maritialStatus?: string;
		creditRepairBefore?: boolean;
		bankRoutingNumber?: string;
		bankAccountNumber?: string;
		bankruptcy?: boolean;
		previoiusFinanceCompany?: boolean;
	};
	educationInfo: {
		collegeAttended?: string;
		fieldOfStudy?: string;
		degree?: string;
		graduatedDate?: Date;
	};
	employmentInfo: {
		employerName?: string;
		employerPhone?: string;
		employerAddress?: string;
		startDate?: Date;
		jobTitle?: string;
		earnIncomeYearRound?: number;
	};
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
}

const customerSchema: Schema = new Schema(
	{
		hubspotId: {
			type: String,
		},
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		middleName: String,
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
		referralPartner: String,
		associatedBrand: {
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
	},
	{ timestamps: true }
);

const objectModel = model<ICustomer>('Customer', customerSchema);

export { ICustomer };
export default objectModel;
