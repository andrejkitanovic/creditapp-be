import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import LoanPackage from 'models/loanPackage';

export const getLoanPackages: RequestHandler = async (req, res, next) => {
	try {
		const { data: loanPackages, count } = await queryFilter({
			Model: LoanPackage,
			query: req.query,
			populate: 'customer',
			// searchFields: ['firstName', 'lastName', 'middleName'],
		});

		res.json({
			data: loanPackages,
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
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
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
			// message: i18n.__('CONTROLLER.PARTNER.PUT_PARTNER.UPDATED'),
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
			// message: i18n.__('CONTROLLER.PARTNER.DELETE_PARTNER.DELETED'),
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
