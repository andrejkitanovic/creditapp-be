import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import i18n from 'helpers/i18n';
import User, { IUser } from 'models/user';
import { rolePermissions } from 'helpers/permissions';
import { sendResetPassword } from 'utils/mailer';
import { LeanDocument } from 'mongoose';
import Organisation, { IOrganisation } from 'models/organisation';
import { isOrganisationActive } from 'middlewares/auth';

export const getMe: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.auth;

		const me = (await User.findById(id).populate('organisation').lean()) as LeanDocument<IUser>;

		res.json({
			data: {
				...me,
				permissions: rolePermissions[me.role],
			},
		});
	} catch (err) {
		next(err);
	}
};

export const postLogin: RequestHandler = async (req, res, next) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email: email.toLowerCase() });
		const organisation = await Organisation.findById(user?.organisation).lean();
		const organisationActive = await isOrganisationActive(organisation as LeanDocument<IOrganisation>);

		if (!user) {
			res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.USER_NOT_FOUND') });
		} else if (!organisationActive) {
			res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.ORGANISATION_INACTIVE') });
		}

		const token = jwt.sign({ id: user?._id }, process.env.DECODE_KEY || '', {
			// expiresIn: "1h",
		});

		res.json({
			token,
			message: i18n.__('CONTROLLER.AUTH.POST_LOGIN.LOGGED_IN'),
		});
	} catch (err) {
		next(err);
	}
};

export const postForgotPassword: RequestHandler = async (req, res, next) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email: email.toLowerCase() });
		if (!user) throw new Error('User not found!');

		const token = jwt.sign({ id: user?._id }, process.env.DECODE_KEY || '', {
			expiresIn: '1h',
		});
		await sendResetPassword({ user: user as IUser, token, email });

		res.json({
			message: i18n.__('CONTROLLER.AUTH.POST_FORGOT_PASSWORD.EMAIL_SENT'),
		});
	} catch (err) {
		next(err);
	}
};

export const postRegister: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { name, password } = req.body;

		const hashedPassword = await bcrypt.hash(password, 12);

		await User.findByIdAndUpdate(id, {
			password: hashedPassword,
			name,
			confirmed: true,
		});

		const token = jwt.sign({ id }, process.env.DECODE_KEY || '', {
			// expiresIn: "1h",
		});

		res.json({
			token,
			message: i18n.__('CONTROLLER.AUTH.POST_REGISTER.REGISTERED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putMe: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.auth;
		const { name, phone } = req.body;

		await User.findByIdAndUpdate(id, {
			name,
			phone,
		});

		res.json({
			message: i18n.__('CONTROLLER.AUTH.PUT_ME.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putMePassword: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.auth;
		const { password } = req.body;

		const hashedPassword = await bcrypt.hash(password, 12);

		await User.findByIdAndUpdate(id, {
			password: hashedPassword,
		});

		res.json({
			message: i18n.__('CONTROLLER.AUTH.PUT_ME_PASSWORD.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};
