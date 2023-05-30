import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import {
	getOrganisations as getOrganisationsController,
	postOrganisation as postOrganisationController,
	putOrganisation as putOrganisationController,
	deleteOrganisation as deleteOrganisationController,
	// deactivateOrganisation as deactivateOrganisationController,
	getMineOrganisation as getMineOrganisationController,
	getSingleOrganisation as getSingleOrganisationController,
} from 'controllers/organisation';
// import {
// 	postOrganisation as postOrganisationValidator,
// 	putOrganisation as putOrganisationValidator,
// } from 'validators/organisation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/mine',
		roles: ['admin'],
		controller: getMineOrganisationController,
	},
	{
		method: 'get',
		route: '/',
		roles: ['admin'],
		// permissions: ['read:organisations'],
		controller: getOrganisationsController,
	},
	{
		method: 'post',
		route: '/',
		roles: ['admin'],
		// permissions: ['write:organisations'],
		// validator: postOrganisationValidator,
		controller: postOrganisationController,
	},
	{
		method: 'put',
		route: '/:id',
		roles: ['admin'],
		// permissions: ['update:organisations'],
		// validator: putOrganisationValidator,
		controller: putOrganisationController,
	},
	{
		method: 'delete',
		route: '/:id',
		roles: ['admin'],
		// permissions: ['delete:organisations'],
		// validator: deleteOrganisationValidator,
		controller: deleteOrganisationController,
	},
	{
		method: 'get',
		route: '/:id',
		roles: ['admin'],
		// permissions: ['read:organisations'],
		controller: getSingleOrganisationController,
	},
]);

export default router;
