import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getCreditEvaluations as getCreditEvaluationsController,
	postCreditEvaluation as postCreditEvaluationController,
	putCreditEvaluation as putCreditEvaluationController,
	deleteCreditEvaluation as deleteCreditEvaluationController,
	getSingleCreditEvaluation as getSingleCreditEvaluationController,
	postCreditEvaluationIncome as postCreditEvaluationIncomeController,
} from 'controllers/creditEvaluation';
// import {
// 	postCreditEvaluation as postCreditEvaluationValidator,
// 	putCreditEvaluation as putCreditEvaluationValidator,
// 	deleteCreditEvaluation as deleteCreditEvaluationValidator,
// } from 'validators/distillation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['read:distillation'],
		controller: getCreditEvaluationsController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['write:distillation'],
		// validator: postCreditEvaluationValidator,
		controller: postCreditEvaluationController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['update:distillation'],
		// validator: putCreditEvaluationValidator,
		controller: putCreditEvaluationController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['delete:distillation'],
		// validator: deleteCreditEvaluationValidator,
		controller: deleteCreditEvaluationController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: getSingleCreditEvaluationController,
	},
	{
		method: 'post',
		route: '/income/:id',
		roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: postCreditEvaluationIncomeController,
	},
]);

export default router;
