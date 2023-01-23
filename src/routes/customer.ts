import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getCustomers as getCustomersController,
	getHSCustomer as getHSCustomerController,
	postCustomer as postCustomerController,
	putCustomer as putCustomerController,
	deleteCustomer as deleteCustomerController,
	getSingleCustomer as getSingleCustomerController,
	putCustomerSyncHubspot as putCustomerSyncHubspotController,
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
		method: 'get',
		route: '/hubspot',
		roles: ['user', 'admin'],
		permissions: ['read:customers'],
		controller: getHSCustomerController,
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
	{
		method: 'get',
		route: '/:id',
		// roles: ['user', 'admin'],
		// permissions: ['read:customers'],
		controller: getSingleCustomerController,
	},
	{
		method: 'put',
		route: '/hubspot/:id',
		roles: ['user', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerValidator,
		controller: putCustomerSyncHubspotController,
	},
]);

export default router;
