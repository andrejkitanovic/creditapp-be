import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import { getHubspotLenders as getHubspotLendersController } from 'controllers/hubspot';
import { RolesEnum } from 'models/user';
// import {
// } from 'validators/creditEvaluation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/lenders',
		roles: Object.values(RolesEnum),
		// permissions: ['read:distillation'],
		controller: getHubspotLendersController,
	},
]);

export default router;
