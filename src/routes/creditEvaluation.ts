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
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:distillation'],
		controller: getCreditEvaluationsController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['write:distillation'],
		// validator: postCreditEvaluationValidator,
		controller: postCreditEvaluationController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['update:distillation'],
		// validator: putCreditEvaluationValidator,
		controller: putCreditEvaluationController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['delete:distillation'],
		// validator: deleteCreditEvaluationValidator,
		controller: deleteCreditEvaluationController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: getSingleCreditEvaluationController,
	},
	{
		method: 'post',
		route: '/income/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: postCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/income/:id/:incomeId',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/debt/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationDebtController,
	},
	{
		method: 'delete',
		route: '/income/:id/:incomeId',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: deleteCreditEvaluationIncomeController,
	},
	{
		method: 'put',
		route: '/loan-applications/hubspot/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationLoanApplicationsToHubspotController,
	},
	{
		method: 'put',
		route: '/household-income/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationHouseholdIncomeController,
	},
	{
		method: 'put',
		route: '/loan-affordability/rate/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: putCreditEvaluationLoanAffordabilityRateController,
	}
]);

export default router;
