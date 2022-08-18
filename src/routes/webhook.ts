import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	postWebhookCustomer as postWebhookCustomerController,
	// postWebhookCreditEvaluation as postWebhookCreditEvaluationController,
} from 'controllers/webhook';
// import {
// 	postDeal as postDealValidator,
// 	putDeal as putDealValidator,
// 	deleteDeal as deleteDealValidator,
// } from 'validators/distillation';

const router = Router();
defineRoutes(router, [
	{
		method: 'post',
		route: '/customer',
		// roles: ['user', 'admin'],
		// permissions: ['read:distillation'],
		controller: postWebhookCustomerController,
	},
	// {
	// 	method: 'post',
	// 	route: '/credit-evaluation',
	// 	// roles: ['user', 'admin'],
	// 	// permissions: ['read:distillation'],
	// 	controller: postWebhookCreditEvaluationController,
	// },
]);

export default router;

// https://backend.loanly.ai/api/webhook/customer
