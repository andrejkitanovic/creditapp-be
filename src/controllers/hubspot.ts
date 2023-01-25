import { Client } from '@hubspot/api-client';
import { SimplePublicObject } from '@hubspot/api-client/lib/codegen/crm/companies';
import {
	Filter as ContactFilter,
	FilterGroup as ContactFilterGroup,
} from '@hubspot/api-client/lib/codegen/crm/contacts';
import { RequestHandler } from 'express';
import { ILoanApplication } from 'models/loanApplication';
import { LeanDocument } from 'mongoose';

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
			'email',
			'firstname',
			'lastname',
			'phone',
			'address',
			'date_of_birth',
			'mobilephone', // phone
			'city',
			'referred_by', // referral partner
			'state',
			'zip',
			'birth_city', // place of birth
			'mother_s_maiden_name',
			'favorite_pet_s_name',
			'college_university_attended',
			'field_of_study',
			'degree',
			'graduation_date',
			'monthly_housing_payment', // monthly home cost
			'monthly_gross_income', // personal monthly income
			'total_annual_household_income', // House hold annual income
			'credit_union_login', // Credit union ???
			'military_status',
			'judgements_liens_bankruptcy_', //bankrupcy
			'routing_number', //bank routing number
			'account_number', //bank account number ???
			'employer', // employer name
			'employer_phone_number',
			'start_date_with_employer', // start date
			'jobtitle',
			'retirement_account_balance',
			'calculated_real_estate_value', // avm value
			'market_value_in_response_com', // market value
			'zillow_value',
			'estimated_credit_score', // estimated equity ???
			'estimated_property_value', // Estimated value
			'calculated_equity', // real equity ???
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
				'email',
				'firstname',
				'lastname',
				'phone',
				'address',
				'date_of_birth',
				'mobilephone', // phone
				'city',
				'referred_by', // referral partner
				'state',
				'zip',
				'birth_city', // place of birth
				'mother_s_maiden_name',
				'favorite_pet_s_name',
				'college_university_attended',
				'field_of_study',
				'degree',
				'graduation_date',
				'monthly_housing_payment', // monthly home cost
				'monthly_gross_income', // personal monthly income
				'total_annual_household_income', // House hold annual income
				'credit_union_login', // Credit union ???
				'military_status',
				'judgements_liens_bankruptcy_', //bankrupcy
				'routing_number', //bank routing number
				'account_number', //bank account number ???
				'employer', // employer name
				'employer_phone_number',
				'start_date_with_employer', // start date
				'jobtitle',
				'retirement_account_balance',
				'calculated_real_estate_value', // avm value
				'market_value_in_response_com', // market value
				'zillow_value',
				'estimated_credit_score', // estimated equity ???
				'estimated_property_value', // Estimated value
				'calculated_equity', // real equity ???
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
		const { properties } = await hubspotClient.crm.objects.basicApi.getById('2-11419675', lenderId, ['lender_name']);

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
