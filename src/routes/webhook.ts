import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	postWebhookCustomer as postWebhookCustomerController,
	putSyncCustomer as putSyncCustomerController,
	putSyncCreditEvaluationDeal as putSyncCreditEvaluationDealController,
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
	{
		method: 'put',
		route: `/sync/credit-evaluation/deal/:dealId`,
		controller: putSyncCreditEvaluationDealController,
	},
]);

export default router;
