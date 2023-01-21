import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getLoanApplications as getLoanApplicationsController,
	postLoanApplication as postLoanApplicationController,
	putLoanApplication as putLoanApplicationController,
	deleteLoanApplication as deleteLoanApplicationController,
	getSingleLoanApplication as getSingleLoanApplicationController
} from 'controllers/loanApplication';
// import {
// } from 'validators/loanApplication';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['read:distillation'],
		controller: getLoanApplicationsController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['write:distillation'],
		// validator: postLoanApplicationValidator,
		controller: postLoanApplicationController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['update:distillation'],
		// validator: putLoanApplicationValidator,
		controller: putLoanApplicationController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['delete:distillation'],
		// validator: deleteLoanApplicationValidator,
		controller: deleteLoanApplicationController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['delete:distillation'],
		controller: getSingleLoanApplicationController,
	},
]);

export default router;