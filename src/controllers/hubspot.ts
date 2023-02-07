import { Client } from '@hubspot/api-client';
import { SimplePublicObject } from '@hubspot/api-client/lib/codegen/crm/companies';
import {
	Filter as ContactFilter,
	FilterGroup as ContactFilterGroup,
} from '@hubspot/api-client/lib/codegen/crm/contacts';
import { RequestHandler } from 'express';
import { ICustomer } from 'models/customer';
import { ILoanApplication } from 'models/loanApplication';
import { LeanDocument } from 'mongoose';
import { filterObject } from 'utils/filterObject';

const hubspotClient = new Client({ accessToken: process.env.HS_ACCESS_TOKEN });

// Routes

export const getHubspotLenders: RequestHandler = async (req, res, next) => {
	try {
		const { results: hsLenders } = await hubspotClient.crm.objects.basicApi.getPage('2-11419675', 100, undefined, [
			'lender_name',
			'origination_fee',
			'credit_bureau',
		]);
		const lenders =
			hsLenders?.map((lender) => ({
				id: lender.id,
				...lender.properties,
			})) ?? [];

		res.json({
			data: lenders,
		});
	} catch (err) {
		next(err);
	}
};

// CONTACTS
export const hsGetContactById = async (contactId: string): Promise<{ [key: string]: string }> => {
	try {
		const { properties } = await hubspotClient.crm.contacts.basicApi.getById(contactId, [
			// GENERAL INFORMATION
			'firstname',
			'middle_name_or_initial',
			'lastname',
			'salutation',
			'email',
			'date_of_birth',
			'address',
			'city',
			'state',
			'zip',
			'phone',
			'mobilephone',

			// PERSONAL INFORMATION
			'driver_s_license_number',
			'dl_issuance_date',
			'dl_expiration_date',
			'member_of_credit_union',
			// 'leadin_current_bank_relationship_a336c6175472fb581f1e7ca0877fd813', // archived
			'personal_banking_relationship',
			'current_military_affiliation',
			'routing_number',
			'account_number',
			'have_you_been_through_credit_repair_',
			'judgements_liens_bankruptcy_',
			'have_you_worked_with_a_finance_company_like_ours_before_',

			// HOUSING INFO
			'housing_status',
			'monthly_housing_payment',
			'estimated_length_of_time_at_residence',
			'move_in_date',
			'calculated_length_of_time_at_residence',
			'years_at_current_address',

			// EMPLOYMENT INFO
			'income_type',
			'employer',
			'employer_phone_number',
			'employer_address',
			'estimated_time_at_job',
			'start_date_with_employer',
			'calculated_length_of_employment',
			'occupation_position',
			'monthly_gross_income',
			'annual_personal_income',
			'front_end_dti_ratio',
			'total_annual_household_income',
			'household_front_end_dti_ratio__cloned_',
			'stated_monthly_income',
			'stated_annual_income',
			'stated_annual_household_income',

			// SECURITY QUESTIONS
			'birth_city',
			'were_you_born_in_a_foreign_country_',
			'are_you_a_legal_permanent_resident_',
			'green_card_expiration_date',
			'mother_s_maiden_name',
			'high_school_mascot',
			'high_school_city',
			'name_of_street_you_grew_up_on',
			'favorite_pet_s_name',

			// EDUCATION
			'college_university_attended',
			'field_of_study',
			'degree',
			'graduation_date',
			'graduate_school_attended',
			'graduate_school_field_of_study',
			'graduate_degree_received',

			// ASSET INFORMATION
			'combined_checking_savings_balance',
			'stocks_bonds_mutual_funds',
			'retirement_account_balance',

			// PRIMARY RESIDENCE VALUATION
			'avm_in_response_com',
			'market_value_in_response_com',
			'zillow_value',
			'estimated_property_value',
			'calculated_value',
			'calculated_equity',
		]);

		return {
			id: contactId,
			...properties,
		};
	} catch (err) {
		console.log(err);

		return {};
	}
};

export const hsGetSingleContact = async (property: string, value: string) => {
	try {
		const filter: ContactFilter = { propertyName: property, operator: 'EQ', value };
		const filterGroup: ContactFilterGroup = { filters: [filter] };

		const searchFilter = {
			filterGroups: [filterGroup],
			properties: [
				// GENERAL INFORMATION
				'firstname',
				'middle_name_or_initial',
				'lastname',
				'salutation',
				'email',
				'date_of_birth',
				'address',
				'city',
				'state',
				'zip',
				'phone',
				'mobilephone',

				// PERSONAL INFORMATION
				'driver_s_license_number',
				'dl_issuance_date',
				'dl_expiration_date',
				'member_of_credit_union',
				// 'leadin_current_bank_relationship_a336c6175472fb581f1e7ca0877fd813', // archived
				'personal_banking_relationship',
				'current_military_affiliation',
				'routing_number',
				'account_number',
				'have_you_been_through_credit_repair_',
				'judgements_liens_bankruptcy_',
				'have_you_worked_with_a_finance_company_like_ours_before_',

				// HOUSING INFO
				'housing_status',
				'monthly_housing_payment',
				'estimated_length_of_time_at_residence',
				'move_in_date',
				'calculated_length_of_time_at_residence',
				'years_at_current_address',

				// EMPLOYMENT INFO
				'income_type',
				'employer',
				'employer_phone_number',
				'employer_address',
				'estimated_time_at_job',
				'start_date_with_employer',
				'calculated_length_of_employment',
				'occupation_position',
				'monthly_gross_income',
				'annual_personal_income',
				'front_end_dti_ratio',
				'total_annual_household_income',
				'household_front_end_dti_ratio__cloned_',
				'stated_monthly_income',
				'stated_annual_income',
				'stated_annual_household_income',

				// SECURITY QUESTIONS
				'birth_city',
				'were_you_born_in_a_foreign_country_',
				'are_you_a_legal_permanent_resident_',
				'green_card_expiration_date',
				'mother_s_maiden_name',
				'high_school_mascot',
				'high_school_city',
				'name_of_street_you_grew_up_on',
				'favorite_pet_s_name',

				// EDUCATION
				'college_university_attended',
				'field_of_study',
				'degree',
				'graduation_date',
				'graduate_school_attended',
				'graduate_school_field_of_study',
				'graduate_degree_received',

				// ASSET INFORMATION
				'combined_checking_savings_balance',
				'stocks_bonds_mutual_funds',
				'retirement_account_balance',

				// PRIMARY RESIDENCE VALUATION
				'avm_in_response_com',
				'market_value_in_response_com',
				'zillow_value',
				'estimated_property_value',
				'calculated_value',
				'calculated_equity',
			],
			limit: 1,
			sorts: ['id'],
			after: 0,
		};
		return await hubspotClient.crm.contacts.searchApi.doSearch(searchFilter);
	} catch (err) {
		console.log(err);

		return {
			results: [],
			total: 0,
		};
	}
};

export const hsCreateContact = async (customer: any): Promise<Record<string, never> | SimplePublicObject> => {
	try {
		return await hubspotClient.crm.contacts.basicApi.create({
			properties: {
				email: customer.email,
				firstname: customer.firstName,
				lastname: customer.lastName,
				phone: customer.phone,
			},
		});
	} catch (err) {
		console.log(err);

		return {};
	}
};

export const hsUpdateContact = async (
	contactId: string,
	customer: LeanDocument<ICustomer>
): Promise<Record<string, never> | SimplePublicObject> => {
	try {
		return await hubspotClient.crm.contacts.basicApi.update(contactId, {
			properties: filterObject({
				email: customer.email,
				firstname: customer.firstName,
				lastname: customer.lastName,
				phone: customer.phone,
				address: customer.address,
				// 'date_of_birth',
				mobilephone: customer.phone,
				city: customer.city,
				referred_by: customer.referralSource,
				state: customer.state,
				zip: customer.zip,
				birth_city: customer.personalInfo?.placeOfBirth,
				mother_s_maiden_name: customer.personalInfo?.mothersMaidenName,
				favorite_pet_s_name: customer.personalInfo?.nameOfPet,
				college_university_attended: customer.educationInfo?.collegeAttended,
				field_of_study: customer.educationInfo?.fieldOfStudy,
				degree: customer.educationInfo?.degree,
				// graduation_date: customer.city,
				monthly_housing_payment: customer.personalInfo?.monthlyHomeCost, // monthly home cost
				monthly_gross_income: customer.personalInfo?.householdAnnualIncome, // personal monthly income
				// total_annual_household_income: customer.,
				credit_union_login: customer.personalInfo?.creditUnion, // Credit union ???
				military_status: customer.personalInfo?.militaryStatus,
				judgements_liens_bankruptcy_: customer.personalInfo?.bankruptcy, //bankrupcy
				routing_number: customer.personalInfo?.bankRoutingNumber, //bank routing number
				account_number: customer.personalInfo?.bankAccountNumber, //bank account number ???
				employer: customer.employmentInfo?.employerName, // employer name
				employer_phone_number: customer.employmentInfo?.employerPhone,
				start_date_with_employer: customer.employmentInfo?.startDate, // start date
				jobtitle: customer.employmentInfo?.jobTitle,
				retirement_account_balance: customer.assetInfo?.retirementBalance,
				calculated_real_estate_value: customer.assetInfo?.avmValue, // avm value
				market_value_in_response_com: customer.assetInfo?.marketValue, // market value
				zillow_value: customer.assetInfo?.zillowValue,
				// estimated_credit_score: customer.city, // estimated equity ???
				estimated_property_value: customer.assetInfo?.estimatedValue, // Estimated value
				// calculated_equity: customer.city, // real equity ???
			}),
		});
	} catch (err) {
		console.log(err);

		return {};
	}
};

// DEALS
export const hsGetDealById = async (dealId: string): Promise<{ [key: string]: string }> => {
	try {
		const { properties } = await hubspotClient.crm.deals.basicApi.getById(dealId, [
			'dealname',
			'amount',
			'monthly_payment',
			'term_months',
			'interest_rate',
			'origination_fee',
		]);

		return {
			id: dealId,
			...properties,
		};
	} catch (err) {
		console.log(err);

		return {};
	}
};

// LENDERS
export const hsGetLenderById = async (lenderId: string): Promise<{ [key: string]: string }> => {
	try {
		const { properties } = await hubspotClient.crm.objects.basicApi.getById('2-11419675', lenderId, [
			'lender_name',
			'credit_bureau',
		]);

		return {
			id: lenderId,
			...properties,
		};
	} catch (err) {
		console.log(err);

		return {};
	}
};

// LOANS
export const hsCreateLoan = async (loanApplication: LeanDocument<ILoanApplication>) => {
	try {
		const { id } = await hubspotClient.crm.objects.basicApi.create('2-11419916', {
			properties: {
				loan_name: loanApplication.name,
				amount: loanApplication.loanAmount?.toString(),

				monthly_payment: loanApplication.monthlyPayment?.toString(),
				term___months: loanApplication.term?.toString(),
				// : loanApplication.creditInquiry,
				// application_date: loanApplication.applicationDate,
				// loan_stage: loanApplication.status,
				// : loanApplication.accountType,
				interest_rate: loanApplication.interestRate?.toString(),
				// : loanApplication.loanWeightFactor?.toString(),
				origination_fee: loanApplication.originationFee?.toString(),
				// : loanApplication.reasonCode?.toString(),
				loan_apr: loanApplication.apr?.toString(),
			},
		});

		return id;
	} catch (err) {
		console.log(err);

		return null;
	}
};

export const hsUpdateLoan = async (loanApplication: LeanDocument<ILoanApplication>) => {
	try {
		const { id } = await hubspotClient.crm.objects.basicApi.update('2-11419916', loanApplication.hubspotId ?? '', {
			properties: {
				loan_name: loanApplication.name,
				amount: loanApplication.loanAmount?.toString(),

				monthly_payment: loanApplication.monthlyPayment?.toString(),
				term___months: loanApplication.term?.toString(),
				// : loanApplication.creditInquiry,
				// application_date: loanApplication.applicationDate,
				// loan_stage: loanApplication.status,
				// : loanApplication.accountType,
				interest_rate: loanApplication.interestRate?.toString(),
				// : loanApplication.loanWeightFactor?.toString(),
				origination_fee: loanApplication.originationFee?.toString(),
				// : loanApplication.reasonCode?.toString(),
				loan_apr: loanApplication.apr?.toString(),
			},
		});

		return id;
	} catch (err) {
		console.log(err);

		return null;
	}
};

export const hsDeleteLoan = async (loanApplicationId: string) => {
	try {
		await hubspotClient.crm.objects.basicApi.archive('2-11419916', loanApplicationId);
	} catch (err) {
		console.log(err);
	}
};
