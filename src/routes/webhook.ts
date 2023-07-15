import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	postWebhookCustomer as postWebhookCustomerController,
	putSyncCustomer as putSyncCustomerController,
} from 'controllers/webhook';
import createLogMiddleware from 'middlewares/createLog';
// import {
// } from 'validators/webhook';

const router = Router();
defineRoutes(router, [
	{
		method: 'post',
		route: '/customer',
		middlewares: [createLogMiddleware],
		controller: postWebhookCustomerController,
	},
	{
		method: 'put',
		route: `/sync/customer/:hubspotId`,
		controller: putSyncCustomerController,
	},
]);

export default router;
