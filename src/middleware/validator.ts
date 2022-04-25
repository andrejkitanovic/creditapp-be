import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

const validator: RequestHandler = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		const firstErrors = errors.array({ onlyFirstError: true });
		const errorsToString = firstErrors.map((error) => error.msg).join(', ');
		const capitalizeError = errorsToString.charAt(0).toUpperCase() + errorsToString.slice(1);

		return res.status(400).json({
			message: `${capitalizeError}!`,
		});
	}

	return next();
};

export default validator;
