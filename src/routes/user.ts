import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getUsers as getUsersController,
	// getStatisticsUsers as getStatisticsUsersController,
	// postInviteUser as postInviteUserController,
	putUser as putUserController,
	deleteUser as deleteUserController,
	// postResendEmail as postResendEmailController,
	// getSingleUnconfirmedUser as getSingleUnconfirmedUserController,
} from 'controllers/user';
// import {
// 	postInviteUser as postInviteUserValidator,
// 	getSingleUnconfirmedUser as getSingleUnconfirmedUserValidator,
// } from 'validators/user';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['admin', 'user'],
		permissions: ['read:users'],
		controller: getUsersController,
	},
	// {
	// 	method: 'get',
	// 	route: '/statistics',
	// roles: ['admin', 'user'],
	// 	permissions: ['read:users'],
	// 	controller: getStatisticsUsersController,
	// },
	// {
	// 	method: 'post',
	// 	route: '/invite',
	// roles: ['admin', 'user'],
	// 	permissions: ['write:users'],
	// 	// validator: postInviteUserValidator,
	// 	controller: postInviteUserController,
	// },
	{
		method: 'put',
		route: '/:id',
		// 		roles: ['admin', 'user'],
		permissions: ['update:users'],
		// validator: putUserValidator, // TODO | Validator missing
		controller: putUserController,
	},
	{
		method: 'delete',
		route: '/:id',
		// roles: ['admin', 'user'],
		permissions: ['delete:users'],
		// validator: deleteUserValidator, // TODO | Validator missing
		controller: deleteUserController,
	},
	// {
	// 	method: 'post',
	// 	route: '/resend-email/:id',
	// 	permissions: ['write:users'],
	// 	// validator: postResendEmailValidator, // TODO | Validator missing
	// 	controller: postResendEmailController,
	// },
	// {
	// 	method: 'get',
	// 	route: '/unconfirmed/:id',
	// 	validator: getSingleUnconfirmedUserValidator,
	// 	controller: getSingleUnconfirmedUserController,
	// },
]);

export default router;
