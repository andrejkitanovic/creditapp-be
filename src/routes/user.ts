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
		permissions: ['read:users'],
		controller: getUsersController,
	},
	{
		method: 'post',
		route: '/',
		permissions: ['write:users'],
		validator: postUserValidator,
		controller: postUserController,
	},
	{
		method: 'put',
		route: '/:id',
		permissions: ['update:users'],
		// validator: putUserValidator, // TODO | Validator missing
		controller: putUserController,
	},
	{
		method: 'delete',
		route: '/:id',
		permissions: ['delete:users'],
		// validator: deleteUserValidator, // TODO | Validator missing
		controller: deleteUserController,
	},
	{
		method: 'get',
		route: '/:id',
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
