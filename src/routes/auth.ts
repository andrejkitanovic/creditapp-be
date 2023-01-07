import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getMe as getMeController,
	postLogin as postLoginController,
	postRegister as postRegisterController,
	putMe as putMeController,
} from 'controllers/auth';
import {
	postLogin as postLoginValidator,
	postRegister as postRegisterValidator,
	putMe as putMeValidator,
} from 'validators/auth';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/me',
		roles: ['admin', 'user'],
		controller: getMeController,
	},
	{
		method: 'post',
		route: '/login',
		validator: postLoginValidator,
		controller: postLoginController,
	},
	{
		method: 'post',
		route: '/register/:id',
		validator: postRegisterValidator,
		controller: postRegisterController,
	},
	{
		method: 'put',
		route: '/me',
		roles: ['user', 'admin'],
		validator: putMeValidator,
		controller: putMeController,
	},
]);

export default router;
