import { RequestHandler } from 'express';
import dayjs from 'dayjs';

const logger: RequestHandler = (req, res, next) => {
	const { method, baseUrl, headers } = req;
	const language = headers['accept-language'] || 'en';
	console.log(`[${method}] ${baseUrl} | ${language.toUpperCase()} | ${dayjs().format('HH:mm:ss DD/MM/YYYY')}`);

	next();
};

export default logger;
