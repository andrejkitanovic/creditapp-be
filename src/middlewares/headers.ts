import { RequestHandler } from 'express';

const headers: RequestHandler = (req, res, next) => {
	req.headers.origin = req.headers.origin || req.headers.host;
	next();
};

export default headers;
