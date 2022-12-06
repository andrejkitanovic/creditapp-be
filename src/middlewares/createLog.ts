import { RequestHandler } from 'express';
import Log from 'models/log';

const createLog: RequestHandler = async (req, res, next) => {
	const { method, baseUrl, body } = req;

	await Log.create({
		method,
		url: baseUrl,
		body: JSON.stringify(body),
	});

	return next();
};

export default createLog;
