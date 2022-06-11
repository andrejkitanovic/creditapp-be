import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import Deal from 'models/deal';

export const getDeals: RequestHandler = async (req, res, next) => {
	try {
		const { data: deals, count } = await queryFilter({
			Model: Deal,
			query: req.query,
			populate: 'customer',
			// searchFields: ['firstName', 'lastName', 'middleName'],
		});

		res.json({
			data: deals,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const postDeal: RequestHandler = async (req, res, next) => {
	try {
		const {} = req.body;

		await Deal.create({});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putDeal: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const {} = req.body;

		await Deal.findByIdAndUpdate(id, {});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.PUT_PARTNER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteDeal: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await Deal.findByIdAndDelete(id);

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.DELETE_PARTNER.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleDeal: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const deal = await Deal.findById(id);

		res.json({
			data: deal,
		});
	} catch (err) {
		next(err);
	}
};
