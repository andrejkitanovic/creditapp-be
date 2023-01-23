import { Client } from '@hubspot/api-client';
import {
	Filter as ContactFilter,
	FilterGroup as ContactFilterGroup,
} from '@hubspot/api-client/lib/codegen/crm/contacts';
import { RequestHandler } from 'express';

const hubspotClient = new Client({ accessToken: process.env.HS_ACCESS_TOKEN });

// Routes

export const getHubspotLenders: RequestHandler = async (req, res, next) => {
	try {
		const { results: hsLenders } = await hubspotClient.crm.objects.basicApi.getPage('2-11419675', 100, undefined, [
			'lender_name',
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
};

export const hsGetSingleContact = async (property: string, value: string) => {
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
};

export const hsCreateContact = async (customer: any) => {
	return await hubspotClient.crm.contacts.basicApi.create({
		properties: {
			email: customer.email,
			firstname: customer.firstName,
			lastname: customer.lastName,
			phone: customer.phone,
		},
	});
};

// DEALS
export const hsGetDealById = async (dealId: string): Promise<{ [key: string]: string }> => {
	const { properties } = await hubspotClient.crm.deals.basicApi.getById(dealId, [
		'original_drilldown_1_for_deals',
		'original_drilldown_2_for_deals',
		'hs_analytics_source_data_2',
		'hs_analytics_source',
		'amount',
		'amount_of_financing_requested',
		'deal_apr',
		'experian_credit_score',
		'transunion_credit_score',
		'equifax_credit_score',
		'closedate',
		'closed_lost_reason',
		'createdate',
		'dealname',
		'hubspot_owner_id', // Deal Owner
		'dealstage',
		'invoice_amount',
		'invoice_date',
		'notes_last_updated', // Last Activity Date
	]);

	return {
		id: dealId,
		...properties,
	};
};
