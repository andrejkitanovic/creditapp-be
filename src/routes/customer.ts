import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getCustomers as getCustomersController,
	getHSCustomer as getHSCustomerController,
	postCustomer as postCustomerController,
	putCustomer as putCustomerController,
	putCustomerSpouse as putCustomerSpouseController,
	deleteCustomer as deleteCustomerController,
	getSingleCustomer as getSingleCustomerController,
	putCustomerSyncHubspot as putCustomerSyncHubspotController,
	putRefetchCustomer as putRefetchCustomerController,
} from 'controllers/customer';
// import {
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
		method: 'put',
		route: '/spouse/:id',
		roles: ['user', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerSpouseValidator,
		controller: putCustomerSpouseController,
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
	{
		method: 'put',
		route: '/refetch/:id',
		roles: ['user', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerValidator,
		controller: putRefetchCustomerController,
	},
]);

export default router;
