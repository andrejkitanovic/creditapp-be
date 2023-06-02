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
		permissions: ['read:loan-packages'],
		controller: getLoanPackagesController,
	},
	{
		method: 'post',
		route: '/',
		permissions: ['write:loan-packages'],
		// validator: postLoanPackageValidator,
		controller: postLoanPackageController,
	},
	{
		method: 'put',
		route: '/:id',
		permissions: ['update:loan-packages'],
		// validator: putLoanPackageValidator,
		controller: putLoanPackageController,
	},
	{
		method: 'delete',
		route: '/:id',
		permissions: ['delete:loan-packages'],
		// validator: deleteLoanPackageValidator,
		controller: deleteLoanPackageController,
	},
	{
		method: 'get',
		route: '/:id',
		permissions: ['delete:loan-packages'],
		controller: getSingleLoanPackageController,
	},
]);

export default router;
