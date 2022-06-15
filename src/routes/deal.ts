import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getDeals as getDealsController,
	postDeal as postDealController,
	putDeal as putDealController,
	deleteDeal as deleteDealController,
	getSingleDeal as getSingleDealController
} from 'controllers/deal';
// import {
// 	postDeal as postDealValidator,
// 	putDeal as putDealValidator,
// 	deleteDeal as deleteDealValidator,
// } from 'validators/distillation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['read:distillation'],
		controller: getDealsController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['user', 'admin'],
		// permissions: ['write:distillation'],
		// validator: postDealValidator,
		controller: postDealController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['update:distillation'],
		// validator: putDealValidator,
		controller: putDealController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['delete:distillation'],
		// validator: deleteDealValidator,
		controller: deleteDealController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['user', 'admin'],
		// permissions: ['delete:distillation'],
		controller: getSingleDealController,
	},
]);

export default router;
