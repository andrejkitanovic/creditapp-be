import { body } from 'express-validator';
import i18n from 'helpers/i18n';
import bcrypt from 'bcryptjs';

import User from 'models/user';

export const postLogin = [
	body('email', i18n.__('VALIDATOR.EMAIL.REQUIRED'))
		.notEmpty()
		.isEmail()
		.withMessage(i18n.__('VALIDATOR.EMAIL.NOT_VALID'))
		.custom(async (value: string) => {
			const userExists = await User.exists({ email: { $regex: new RegExp(value, 'i') } });

			if (!userExists) {
				throw new Error(i18n.__('VALIDATOR.USER.NOT_FOUND'));
			}

			return true;
		}),
	body('password', i18n.__('VALIDATOR.PASSWORD.REQUIRED'))
		.notEmpty()
		.custom(async (value: string, { req }) => {
			const user = await User.findOne({ email: req.body.email }).select('password');
			const isValidPassword = await bcrypt.compare(value, user?.password || '');

			if (!isValidPassword) {
				throw new Error(i18n.__('VALIDATOR.USER.INVALID_PASSWORD'));
			}

			return true;
		}),
];

export const postRegister = [
	body('password', i18n.__('VALIDATOR.PASSWORD.REQUIRED')).notEmpty(),
	body('name', i18n.__('VALIDATOR.NAME.REQUIRED')).notEmpty(),
];

export const putMe = [body('name', i18n.__('VALIDATOR.NAME.REQUIRED')).notEmpty()];
