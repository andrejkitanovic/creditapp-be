import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getUsers as getUsersController,
	// getStatisticsUsers as getStatisticsUsersController,
	// postInviteUser as postInviteUserController,
	putUser as putUserController,
	deleteUser as deleteUserController,
	getSingleUser as getSingleUserController
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
		roles: ['admin'],
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
	{
		method: 'put',
		route: '/:id',
		roles: ['admin'],
		permissions: ['update:users'],
		// validator: putUserValidator, // TODO | Validator missing
		controller: putUserController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['admin'],
		permissions: ['delete:users'],
		// validator: deleteUserValidator, // TODO | Validator missing
		controller: deleteUserController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['user', 'admin'],
		permissions: ['read:users'],
		controller: getSingleUserController,
	},
]);

export default router;
