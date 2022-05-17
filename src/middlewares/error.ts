import { ErrorRequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const error: ErrorRequestHandler = (err, req, res, next) => {
	const status = err.statusCode || 500;

	if (err?.response?.data) {
		res.status(status).json(err.response.data);
	} else {
		const { message, data } = err;
		res.status(status).json({ message, data });
	}
};

export default error;
