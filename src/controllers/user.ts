import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import User from 'models/user';
import { hsCreateContact, hsGetSingleContact } from './hubspot';
// import { sendEmailInvitation } from 'utils/mailer';

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
		const { email, role } = req.body;

		const { total, results } = await hsGetSingleContact('email', email);

		let hsUser;
		if (total) {
			hsUser = results[0].properties;

			await User.create({
				hubspotId: hsUser.hs_object_id,
				email,
				role,
				name: `${hsUser.firstname} ${hsUser.lastname}`,
				phone: hsUser.phone,
			});
		} else {
			hsUser = await hsCreateContact({ properties: { email } });

			await User.create({
				hubspotId: hsUser.id,
				email,
				role
			});
		}

		res.json({
			// message: i18n.__('CONTROLLER.USER.PUT_USER.CREATED'),
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
			// message: i18n.__('CONTROLLER.USER.PUT_USER.UPDATED'),
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
			// message: i18n.__('CONTROLLER.USER.DELETE_USER.DELETED'),
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
