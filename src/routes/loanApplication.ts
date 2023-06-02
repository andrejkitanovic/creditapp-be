import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getLoanApplications as getLoanApplicationsController,
	postLoanApplication as postLoanApplicationController,
	putLoanApplication as putLoanApplicationController,
	putLoanApplicationStatus as putLoanApplicationStatusController,
	deleteLoanApplication as deleteLoanApplicationController,
	getSingleLoanApplication as getSingleLoanApplicationController,
} from 'controllers/loanApplication';
// import {
// } from 'validators/loanApplication';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',

		permissions: ['read:credit-evaluations'],
		controller: getLoanApplicationsController,
	},
	{
		method: 'post',
		route: '/',
		permissions: ['write:credit-evaluations'],
		// validator: postLoanApplicationValidator,
		controller: postLoanApplicationController,
	},
	{
		method: 'put',
		route: '/:id',
		permissions: ['update:credit-evaluations'],
		// validator: putLoanApplicationValidator,
		controller: putLoanApplicationController,
	},
	{
		method: 'put',
		route: '/status/:id',
		permissions: ['update:credit-evaluations'],
		// validator: putLoanApplicationValidator,
		controller: putLoanApplicationStatusController,
	},
	{
		method: 'delete',
		route: '/:id',
		permissions: ['delete:credit-evaluations'],
		// validator: deleteLoanApplicationValidator,
		controller: deleteLoanApplicationController,
	},
	{
		method: 'get',
		route: '/:id',
		permissions: ['delete:credit-evaluations'],
		controller: getSingleLoanApplicationController,
	},
]);

export default router;
