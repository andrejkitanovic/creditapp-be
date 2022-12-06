import { RequestHandler } from 'express';

import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import Log from 'models/log';

export const getLogs: RequestHandler = async (req, res, next) => {
	try {
		const { data: logs, count } = await queryFilter({
			Model: Log,
			query: req.query,
			// searchFields: [],
		});

		res.json({
			data: logs,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};
