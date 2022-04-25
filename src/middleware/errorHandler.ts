import { ErrorRequestHandler } from 'express';

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
	const status = err.statusCode || 500;

	if (err?.response?.data) {
		res.status(status).json(err.response.data);
	} else {
		const { message, data } = err;
		res.status(status).json({ message, data });
	}

	next();
};

export default errorHandler;
