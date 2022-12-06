import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import { postWebhookCustomer as postWebhookCustomerController } from 'controllers/webhook';
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
]);

export default router;
