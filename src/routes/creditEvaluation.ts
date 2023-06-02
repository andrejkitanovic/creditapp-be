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
	putCreditEvaluationLoanAffordabilityRate as putCreditEvaluationLoanAffordabilityRateController,
} from 'controllers/creditEvaluation';
// import {
// } from 'validators/creditEvaluation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		permissions: ['read:credit-evaluations'],
		controller: getCreditEvaluationsController,
	},
	{
		method: 'post',
		route: '/',
		permissions: ['write:credit-evaluations'],
		// validator: postCreditEvaluationValidator,
		controller: postCreditEvaluationController,
	},
	{
		method: 'put',
		route: '/:id',
		permissions: ['update:credit-evaluations'],
		// validator: putCreditEvaluationValidator,
		controller: putCreditEvaluationController,
	},
	{
		method: 'delete',
		route: '/:id',
		permissions: ['delete:credit-evaluations'],
		// validator: deleteCreditEvaluationValidator,
		controller: deleteCreditEvaluationController,
	},
	{
		method: 'get',
		route: '/:id',
		permissions: ['read:credit-evaluations'],
		controller: getSingleCreditEvaluationController,
	},
	{
		method: 'post',
		route: '/income/:id',
		permissions: ['update:credit-evaluations'],
		controller: postCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/income/:id/:incomeId',
		permissions: ['update:credit-evaluations'],
		controller: putCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/debt/:id',
		permissions: ['update:credit-evaluations'],
		controller: putCreditEvaluationDebtController,
	},
	{
		method: 'delete',
		route: '/income/:id/:incomeId',
		permissions: ['update:credit-evaluations'],
		controller: deleteCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/loan-applications/hubspot/:id',
		permissions: ['update:credit-evaluations'],
		controller: putCreditEvaluationLoanApplicationsToHubspotController,
	},
	{
		method: 'put',
		route: '/household-income/:id',
		permissions: ['update:credit-evaluations'],
		controller: putCreditEvaluationHouseholdIncomeController,
	},
	{
		method: 'put',
		route: '/loan-affordability/rate/:id',
		permissions: ['update:credit-evaluations'],
		controller: putCreditEvaluationLoanAffordabilityRateController,
	},
]);

export default router;
