import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import { postWebhookCustomer as postWebhookCustomerController } from 'controllers/webhook';
// import {
// } from 'validators/webhook';

const router = Router();
defineRoutes(router, [
	{
		method: 'post',
		route: '/customer',
		controller: postWebhookCustomerController,
	},
]);

export default router;
