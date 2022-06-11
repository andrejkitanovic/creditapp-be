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
// } from 'validators/customer';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['user', 'admin'],
		permissions: ['read:customers'],
		controller: getCustomersController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['user', 'admin'],
		permissions: ['write:customers'],
		// validator: postCustomerValidator,
		controller: postCustomerController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['user', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerValidator,
		controller: putCustomerController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['user', 'admin'],
		permissions: ['delete:customers'],
		// validator: deleteCustomerValidator,
		controller: deleteCustomerController,
	},
]);

export default router;
