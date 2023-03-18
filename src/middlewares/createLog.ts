import { RequestHandler } from 'express';
import Log from 'models/log';

const createLog: RequestHandler = async (req, res, next) => {
	const { method, baseUrl, body } = req;

	next();

	res.on('finish', async () => {
		const { statusCode, statusMessage } = res;
		const { req } = await res.json();

		await Log.create({
			method,
			url: baseUrl,
			body: JSON.stringify(body),
			statusCode,
			statusMessage,
			response: JSON.stringify(req.body),
		});
	});
};

export default createLog;
