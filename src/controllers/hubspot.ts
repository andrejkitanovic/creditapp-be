import { Client } from '@hubspot/api-client';
import {
	Filter as ContactFilter,
	FilterGroup as ContactFilterGroup,
} from '@hubspot/api-client/lib/codegen/crm/contacts';
import { Filter as DealFilter, FilterGroup as DealFilterGroup } from '@hubspot/api-client/lib/codegen/crm/deals';

const hubspotClient = new Client({ accessToken: process.env.HS_ACCESS_TOKEN });

// CONTACTS
export const hsGetAllContacts = async () => {
	return await hubspotClient.crm.contacts.getAll();
};

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

export const hsCreateContact = async (data: any) => {
	return await hubspotClient.crm.contacts.basicApi.create({ properties: data });
};

// DEALS
export const hsGetAllDeals = async () => {
	return await hubspotClient.crm.deals.getAll();
};

export const hsGetSingleDeal = async (property: string, value: string) => {
	const filter: DealFilter = { propertyName: property, operator: 'EQ', value };
	const filterGroup: DealFilterGroup = { filters: [filter] };
	const searchFilter = {
		filterGroups: [filterGroup],
		properties: ['dealname'],
		limit: 1,
		sorts: ['id'],
		after: 0,
	};
	return await hubspotClient.crm.deals.searchApi.doSearch(searchFilter);
};

export const hsCreateDeal = async (data: any) => {
	return await hubspotClient.crm.deals.basicApi.create({ properties: data });
};