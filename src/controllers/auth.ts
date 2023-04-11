import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import i18n from 'helpers/i18n';
import User, { IUser } from 'models/user';
import { adminPermissions } from 'helpers/permissions';
import { sendResetPassword } from 'utils/mailer';

export const getMe: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.auth;

		const me = (await User.findById(id)) as IUser;

		if (me) {
			me.permissions = adminPermissions;
		}

		res.json({
			data: me,
		});
	} catch (err) {
		next(err);
	}
};

export const postLogin: RequestHandler = async (req, res, next) => {
	try {
		const { email } = req.body;

		const user = await User.findOne({ email: { $regex: new RegExp(email, 'i') } });

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

		const user = await User.findOne({ email: { $regex: new RegExp(email, 'i') } });

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
