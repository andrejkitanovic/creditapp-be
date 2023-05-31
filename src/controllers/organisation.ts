import { RequestHandler } from 'express';
import { queryFilter } from 'helpers/filters';

import i18n from 'helpers/i18n';
import { createMeta } from 'helpers/meta';
import Organisation from 'models/organisation';
import { hsCreateLeadSource, hsCreateUser, hsGetUserByEmail } from './hubspot';

export const getMineOrganisation: RequestHandler = async (req, res, next) => {
	try {
		const { organisationId } = req.auth;

		const organisation = await Organisation.findById(organisationId);

		res.json({
			data: organisation,
		});
	} catch (err) {
		next(err);
	}
};

export const getOrganisations: RequestHandler = async (req, res, next) => {
	try {
		const { organisationId } = req.auth;

		const { data: organisations, count } = await queryFilter({
			Model: Organisation,
			query: req.query,
			searchFields: ['name'],
			defaultFilters: { _id: { $ne: organisationId } },
		});

		res.json({
			data: organisations,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const postOrganisation: RequestHandler = async (req, res, next) => {
	try {
		const { name, email, leadSource, brand, partnerPayout } = req.body;

		const createLeadSource = await hsCreateLeadSource(leadSource);
		if (!createLeadSource) throw new Error('Lead Source Already Exists!');

		let hsUser = await hsGetUserByEmail(email);
		if (!hsUser?.id) {
			hsUser = await hsCreateUser({ email, role: 'partner' });
		}

		await Organisation.create({
			hubspotId: hsUser?.id,
			name,
			email,
			leadSource,
			brand,
			partnerPayout,
		});

		res.json({
			message: i18n.__('CONTROLLER.ORGANISATION.POST_ORGANISATION.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putOrganisation: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, leadSource, brand, partnerPayout } = req.body;

		await Organisation.findByIdAndUpdate(id, {
			name,
			leadSource,
			brand,
			partnerPayout,
		});

		res.json({
			message: i18n.__('CONTROLLER.ORGANISATION.PUT_ORGANISATION.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteOrganisation: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await Organisation.findByIdAndDelete(id);

		res.json({
			message: i18n.__('CONTROLLER.ORGANISATION.DELETE_ORGANISATION.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleOrganisation: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const organisation = await Organisation.findById(id).lean();

		res.json({
			data: organisation,
		});
	} catch (err) {
		next(err);
	}
};
