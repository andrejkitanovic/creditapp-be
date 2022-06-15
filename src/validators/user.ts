// import { body, param } from 'express-validator';
// import i18n from 'helpers/i18n';

// import User from 'models/user';

// export const postInviteUser = [
// 	body('email', i18n.__('VALIDATOR.EMAIL.REQUIRED'))
// 		.notEmpty()
// 		.isEmail()
// 		.withMessage(i18n.__('VALIDATOR.EMAIL.NOT_VALID'))
// 		.custom(async (value: string) => {
// 			const userExists = await User.exists({ email: value });

// 			if (userExists) {
// 				throw new Error(i18n.__('VALIDATOR.EMAIL.IN_USE'));
// 			}

// 			return true;
// 		}),
// 	body('role', i18n.__('VALIDATOR.ROLE.REQUIRED'))
// 		.notEmpty()
// 		.isIn(['portal-admin', 'organisation-owner', 'organisation-employee'])
// 		.withMessage(i18n.__('VALIDATOR.ROLE.ONE_OF')),
// ];

// export const getSingleUnconfirmedUser = [
// 	param('id', i18n.__('VALIDATOR.ID.REQUIRED'))
// 		.notEmpty()
// 		.custom(async (value: string) => {
// 			const user = await User.findById(value);

// 			if (!user) {
// 				throw new Error(i18n.__('VALIDATOR.EMAIL.IN_USE'));
// 			}

// 			if (user.confirmed) {
// 				throw new Error(i18n.__('VALIDATOR.USER.CONFIRMED'));
// 			}

// 			return true;
// 		}),
// ];
