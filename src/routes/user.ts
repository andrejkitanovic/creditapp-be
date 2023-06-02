import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getUsers as getUsersController,
	postUser as postUserController,
	putUser as putUserController,
	deleteUser as deleteUserController,
	getSingleUser as getSingleUserController,
} from 'controllers/user';
import {
	postUser as postUserValidator,
	getSingleUnconfirmedUser as getSingleUnconfirmedUserValidator,
} from 'validators/user';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['admin', 'partner-admin'],
		permissions: ['read:users'],
		controller: getUsersController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['admin', 'partner-admin'],
		permissions: ['write:users'],
		validator: postUserValidator,
		controller: postUserController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['admin', 'partner-admin'],
		permissions: ['update:users'],
		// validator: putUserValidator, // TODO | Validator missing
		controller: putUserController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['admin', 'partner-admin'],
		permissions: ['delete:users'],
		// validator: deleteUserValidator, // TODO | Validator missing
		controller: deleteUserController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['read:users'],
		controller: getSingleUserController,
	},
	{
		method: 'get',
		route: '/unconfirmed/:id',
		validator: getSingleUnconfirmedUserValidator,
		controller: getSingleUserController,
	},
]);

export default router;
