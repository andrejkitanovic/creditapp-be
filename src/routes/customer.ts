import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getCustomers as getCustomersController,
	getHSCustomer as getHSCustomerController,
	postCustomer as postCustomerController,
	putCustomer as putCustomerController,
	putCustomerSpouse as putCustomerSpouseController,
	deleteCustomerSpouse as deleteCustomerSpouseController,
	deleteCustomer as deleteCustomerController,
	getSingleCustomer as getSingleCustomerController,
	putCustomerSyncHubspot as putCustomerSyncHubspotController,
	putCustomerPushHubspot as putCustomerPushHubspotController,
	putRefetchCustomer as putRefetchCustomerController,
} from 'controllers/customer';
// import {
// } from 'validators/customer';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['read:customers'],
		controller: getCustomersController,
	},
	{
		method: 'get',
		route: '/hubspot',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['read:customers'],
		controller: getHSCustomerController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['write:customers'],
		// validator: postCustomerValidator,
		controller: postCustomerController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerValidator,
		controller: putCustomerController,
	},
	{
		method: 'put',
		route: '/spouse/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerSpouseValidator,
		controller: putCustomerSpouseController,
	},
	{
		method: 'delete',
		route: '/spouse/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerSpouseValidator,
		controller: deleteCustomerSpouseController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['delete:customers'],
		// validator: deleteCustomerValidator,
		controller: deleteCustomerController,
	},
	{
		method: 'get',
		route: '/:id',
		// roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		// permissions: ['read:customers'],
		controller: getSingleCustomerController,
	},
	{
		method: 'put',
		route: '/hubspot/sync/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerValidator,
		controller: putCustomerSyncHubspotController,
	},
	{
		method: 'put',
		route: '/hubspot/push/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerValidator,
		controller: putCustomerPushHubspotController,
	},
	{
		method: 'put',
		route: '/refetch/:id',
		roles: ['partner-admin', 'partner', 'partner-sales-rep', 'admin'],
		permissions: ['update:customers'],
		// validator: putCustomerValidator,
		controller: putRefetchCustomerController,
	},
]);

export default router;
