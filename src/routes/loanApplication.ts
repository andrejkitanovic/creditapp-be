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
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:distillation'],
		controller: getLoanApplicationsController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['write:distillation'],
		// validator: postLoanApplicationValidator,
		controller: postLoanApplicationController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['update:distillation'],
		// validator: putLoanApplicationValidator,
		controller: putLoanApplicationController,
	},
	{
		method: 'put',
		route: '/status/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['update:distillation'],
		// validator: putLoanApplicationValidator,
		controller: putLoanApplicationStatusController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['delete:distillation'],
		// validator: deleteLoanApplicationValidator,
		controller: deleteLoanApplicationController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['delete:distillation'],
		controller: getSingleLoanApplicationController,
	},
]);

export default router;
