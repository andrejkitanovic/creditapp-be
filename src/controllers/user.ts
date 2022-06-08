import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import User from 'models/user';
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

// export const putUser: RequestHandler = async (req, res, next) => {
// 	try {
// 		const { id } = req.params;
// 		const { role, email, name } = req.body;

// 		await User.findByIdAndUpdate(id, {
// 			role,
// 			email,
// 			name,
// 		});

// 		res.json({
// 			message: i18n.__('CONTROLLER.USER.PUT_USER.UPDATED'),
// 		});
// 	} catch (err) {
// 		next(err);
// 	}
// };

// export const deleteUser: RequestHandler = async (req, res, next) => {
// 	try {
// 		const { id } = req.params;

// 		await User.findByIdAndDelete(id);

// 		res.json({
// 			message: i18n.__('CONTROLLER.USER.DELETE_USER.DELETED'),
// 		});
// 	} catch (err) {
// 		next(err);
// 	}
// };

// export const postResendEmail: RequestHandler = async (req, res, next) => {
// 	try {
// 		const { id } = req.params;
// 		const user = (await User.findById(id)) as IUser;

// 		await sendEmailInvitation({ organisationId: user.organisation, userId: user._id, email: user.email });

// 		res.json({
// 			message: i18n.__('CONTROLLER.USER.RESEND_EMAIL.SENDED'),
// 		});
// 	} catch (err) {
// 		next(err);
// 	}
// };

// export const getSingleUnconfirmedUser: RequestHandler = async (req, res, next) => {
// 	try {
// 		const { id } = req.params;

// 		const user = await User.findById(id).populate('organisation');

// 		res.json({
// 			data: user,
// 		});
// 	} catch (err) {
// 		next(err);
// 	}
// };
