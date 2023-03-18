import { RequestHandler } from 'express';

import Log from 'models/log';

const createLog: RequestHandler = async (req, res, next) => {
	const { method, baseUrl, body } = req;

	const oldJson = res.json;
	res.json = (body) => {
		res.locals.body = body;
		return oldJson.call(res, body);
	};

	next();

	res.on('finish', async () => {
		const { statusCode, statusMessage, locals } = res;

		await Log.create({
			method,
			url: baseUrl,
			body: JSON.stringify(body),
			statusCode,
			statusMessage,
			response: JSON.stringify(locals.body),
		});
	});
};

export default createLog;
