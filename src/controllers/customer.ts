import { RequestHandler } from 'express';

import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';

import Customer from 'models/customer';
import CreditEvaluation from 'models/creditEvaluation';
import LoanPackage from 'models/loanPackage';

import { hsGetSingleContact, hsCreateContact } from './hubspot';

export const getCustomers: RequestHandler = async (req, res, next) => {
	try {
		const { data: customers, count } = await queryFilter({
			Model: Customer,
			query: req.query,
			searchFields: ['firstName', 'lastName', 'middleName', 'address', 'email'],
		});

		res.json({
			data: customers,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const getHSCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { email } = req.query;

		const { total, results } = await hsGetSingleContact('email', email as string);

		let customer = null;

		if (total) {
			const { firstname, lastname } = results[0].properties;

			customer = {
				firstName: firstname,
				lastName: lastname,
			};
		}

		res.json({
			data: customer,
		});
	} catch (err) {
		next(err);
	}
};

export const postCustomer: RequestHandler = async (req, res, next) => {
	try {
		const {
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralPartner,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		} = req.body;

		const { total, results } = await hsGetSingleContact('email', email);

		let hubspotId;
		if (total) {
			hubspotId = results[0].id;
		} else {
			const hubspotUser = await hsCreateContact(req.body);
			hubspotId = hubspotUser.id;
		}

		await Customer.create({
			hubspotId,
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralPartner,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const {
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralPartner,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		} = req.body;

		await Customer.findByIdAndUpdate(id, {
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralPartner,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.PUT_PARTNER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await Customer.findByIdAndDelete(id);
		await CreditEvaluation.findOneAndDelete({ customer: id });
		await LoanPackage.findOneAndDelete({ customer: id });

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.DELETE_PARTNER.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const customer = await Customer.findById(id);

		res.json({
			data: customer,
		});
	} catch (err) {
		next(err);
	}
};
