import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import IncomeSource from 'models/incomeSource';

export const getIncomeSources: RequestHandler = async (req, res, next) => {
	try {
		const { data: incomeSources, count } = await queryFilter({
			Model: IncomeSource,
			query: req.query,
            populate: 'customer',
			// searchFields: ['firstName', 'lastName', 'middleName'],
		});

		res.json({
			data: incomeSources,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const postIncomeSource: RequestHandler = async (req, res, next) => {
	try {
		const {} = req.body;

		await IncomeSource.create({});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putIncomeSource: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const {} = req.body;

		await IncomeSource.findByIdAndUpdate(id, {});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.PUT_PARTNER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteIncomeSource: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await IncomeSource.findByIdAndDelete(id);

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.DELETE_PARTNER.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleIncomeSource: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const incomeSource = await IncomeSource.findById(id);

		res.json({
			data: incomeSource,
		});
	} catch (err) {
		next(err);
	}
};
