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
import { RolesEnum } from 'models/user';
// import {
// 	postOrganisation as postOrganisationValidator,
// 	putOrganisation as putOrganisationValidator,
// } from 'validators/organisation';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/mine',
		roles: Object.values(RolesEnum),
		controller: getMineOrganisationController,
	},
	{
		method: 'get',
		route: '/',
		permissions: ['read:organisations'],
		controller: getOrganisationsController,
	},
	{
		method: 'post',
		route: '/',
		permissions: ['write:organisations'],
		// validator: postOrganisationValidator,
		controller: postOrganisationController,
	},
	{
		method: 'put',
		route: '/:id',
		permissions: ['update:organisations'],
		// validator: putOrganisationValidator,
		controller: putOrganisationController,
	},
	{
		method: 'delete',
		route: '/:id',
		permissions: ['delete:organisations'],
		// validator: deleteOrganisationValidator,
		controller: deleteOrganisationController,
	},
	{
		method: 'get',
		route: '/:id',
		permissions: ['read:organisations'],
		controller: getSingleOrganisationController,
	},
]);

export default router;
