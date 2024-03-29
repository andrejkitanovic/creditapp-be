import { RequestHandler } from 'express';

import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import LoanApplication from 'models/loanApplication';
import LoanPackage from 'models/loanPackage';

export const getLoanPackages: RequestHandler = async (req, res, next) => {
	try {
		const { organisation } = req.auth;

		let defaultFilters;
		if (organisation.type === 'partner') {
			defaultFilters = { leadSource: { $exists: true, $eq: organisation.leadSource } };
		}

		const { data: loanPackages, count } = await queryFilter({
			Model: LoanPackage,
			query: req.query,
			populate: 'customer creditEvaluation',
			searchFields: ['customer.firstName', 'customer.lastName'],
			defaultFilters,
		});

		const populatedLoanPackages = [];

		for await (const loanPackage of loanPackages) {
			populatedLoanPackages.push({
				...loanPackage,
				loanApplications: (await LoanApplication.find({ creditEvaluation: loanPackage.creditEvaluation._id })) || [],
			});
		}

		res.json({
			data: populatedLoanPackages,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const postLoanPackage: RequestHandler = async (req, res, next) => {
	try {
		const { customer } = req.body;

		await LoanPackage.create({ customer });

		res.json({
			message: i18n.__('CONTROLLER.LOAN_PACKAGE.POST.LOAN_PACKAGE.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putLoanPackage: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { customer } = req.body;

		await LoanPackage.findByIdAndUpdate(id, { customer });

		res.json({
			message: i18n.__('CONTROLLER.LOAN_PACKAGE.PUT.LOAN_PACKAGE.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteLoanPackage: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await LoanPackage.findByIdAndDelete(id);

		res.json({
			message: i18n.__('CONTROLLER.LOAN_PACKAGE.DELETE.LOAN_PACKAGE.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleLoanPackage: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const loanPackage = await LoanPackage.findById(id);

		res.json({
			data: loanPackage,
		});
	} catch (err) {
		next(err);
	}
};
