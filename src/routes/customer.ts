import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getCustomers as getCustomersController,
	postCustomer as postCustomerController,
	putCustomer as putCustomerController,
	deleteCustomer as deleteCustomerController,
} from 'controllers/customer';
// import {
// 	postCustomer as postCustomerValidator,
// 	putCustomer as putCustomerValidator,
// 	deleteCustomer as deleteCustomerValidator,
// } from 'validators/distillation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		// roles: ['portal-admin', 'organisation-owner', 'organisation-employee'],
		// permissions: ['read:distillation'],
		controller: getCustomersController,
	},
	{
		method: 'post',
		route: '/',
		// roles: ['portal-admin', 'organisation-owner', 'organisation-employee'],
		// permissions: ['write:distillation'],
		// validator: postCustomerValidator,
		controller: postCustomerController,
	},
	{
		method: 'put',
		route: '/:id',
		// roles: ['portal-admin', 'organisation-owner', 'organisation-employee'],
		// permissions: ['update:distillation'],
		// validator: putCustomerValidator,
		controller: putCustomerController,
	},
	{
		method: 'delete',
		route: '/:id',
		// roles: ['portal-admin', 'organisation-owner', 'organisation-employee'],
		// permissions: ['delete:distillation'],
		// validator: deleteCustomerValidator,
		controller: deleteCustomerController,
	},
]);

export default router;
