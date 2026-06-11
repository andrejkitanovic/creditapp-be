import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getApiKeys as getApiKeysController,
	postApiKey as postApiKeyController,
	deleteApiKey as deleteApiKeyController,
} from 'controllers/apiKey';
import { RolesEnum } from 'models/user';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: [RolesEnum.ADMIN],
		controller: getApiKeysController,
	},
	{
		method: 'post',
		route: '/',
		roles: [RolesEnum.ADMIN],
		controller: postApiKeyController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: [RolesEnum.ADMIN],
		controller: deleteApiKeyController,
	},
]);

export default router;
