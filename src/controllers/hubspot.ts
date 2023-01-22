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
export const hsGetSingleContact = async (property: string, value: string) => {
	const filter: ContactFilter = { propertyName: property, operator: 'EQ', value };
	const filterGroup: ContactFilterGroup = { filters: [filter] };
	const searchFilter = {
		filterGroups: [filterGroup],
		properties: ['email', 'firstname', 'lastname', 'phone'],
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
