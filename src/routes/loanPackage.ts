import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getLoanPackages as getLoanPackagesController,
	postLoanPackage as postLoanPackageController,
	putLoanPackage as putLoanPackageController,
	deleteLoanPackage as deleteLoanPackageController,
	getSingleLoanPackage as getSingleLoanPackageController
} from 'controllers/loanPackage';
// import {
// } from 'validators/loanPackage';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['read:distillation'],
		controller: getLoanPackagesController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['write:distillation'],
		// validator: postLoanPackageValidator,
		controller: postLoanPackageController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['update:distillation'],
		// validator: putLoanPackageValidator,
		controller: putLoanPackageController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['delete:distillation'],
		// validator: deleteLoanPackageValidator,
		controller: deleteLoanPackageController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['delete:distillation'],
		controller: getSingleLoanPackageController,
	},
]);

export default router;
