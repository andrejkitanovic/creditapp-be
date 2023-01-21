import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import { getHubspotLenders as getHubspotLendersController } from 'controllers/hubspot';
// import {
// } from 'validators/creditEvaluation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/lenders',
		// roles: ['user', 'admin'],
		// permissions: ['read:distillation'],
		controller: getHubspotLendersController,
	},
]);

export default router;
