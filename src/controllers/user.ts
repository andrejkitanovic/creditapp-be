import { RequestHandler } from 'express';

import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import User from 'models/user';
import { sendEmailInvitation } from 'utils/mailer';
import { hsCreateUser, hsGetUserByEmail } from './hubspot';
// import { hsCreateUser, hsGetSingleUser } from './hubspot';

export const getUsers: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.auth;

		const { data: users, count } = await queryFilter({
			Model: User,
			query: req.query,
			searchFields: ['name', 'email'],
			defaultFilters: { _id: { $ne: id } },
		});

		res.json({
			data: users,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const postUser: RequestHandler = async (req, res, next) => {
	try {
		const { organisation, email, role } = req.body;

		let hsUser = await hsGetUserByEmail(email);

		if (!hsUser?.id && role === 'admin') {
			hsUser = await hsCreateUser({ email, role });
		}

		const user = await User.create({
			organisation,
			hubspotId: hsUser?.id,
			email,
			role,
		});

		await sendEmailInvitation({ userId: user._id, email });

		res.json({
			message: i18n.__('CONTROLLER.USER.POST_USER.CREATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putUser: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { role, email, name, phone } = req.body;

		await User.findByIdAndUpdate(id, {
			role,
			email,
			name,
			phone,
		});

		res.json({
			message: i18n.__('CONTROLLER.USER.PUT_USER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteUser: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await User.findByIdAndDelete(id);

		res.json({
			message: i18n.__('CONTROLLER.USER.DELETE_USER.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleUser: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const user = await User.findById(id);

		res.json({
			data: user,
		});
	} catch (err) {
		next(err);
	}
};
