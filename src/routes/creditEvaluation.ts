import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getCreditEvaluations as getCreditEvaluationsController,
	postCreditEvaluation as postCreditEvaluationController,
	putCreditEvaluation as putCreditEvaluationController,
	deleteCreditEvaluation as deleteCreditEvaluationController,
	getSingleCreditEvaluation as getSingleCreditEvaluationController,
	postCreditEvaluationIncome as postCreditEvaluationIncomeController,
	putCreditEvaluationIncome as putCreditEvaluationIncomeController,
	putCreditEvaluationDebt as putCreditEvaluationDebtController,
	deleteCreditEvaluationIncome as deleteCreditEvaluationIncomeController,
	putCreditEvaluationLoanApplicationsToHubspot as putCreditEvaluationLoanApplicationsToHubspotController,
	putCreditEvaluationHouseholdIncome as putCreditEvaluationHouseholdIncomeController,
} from 'controllers/creditEvaluation';
// import {
// } from 'validators/creditEvaluation';

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
	{
		method: 'put',
		route: '/income/:id/:incomeId',
		roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/debt/:id',
		roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationDebtController,
	},
	{
		method: 'delete',
		route: '/income/:id/:incomeId',
		roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: deleteCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/loan-applications/hubspot/:id',
		roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationLoanApplicationsToHubspotController,
	},
	{
		method: 'put',
		route: '/loan-applications/household-income/:id',
		roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationHouseholdIncomeController,
	},
]);

export default router;
