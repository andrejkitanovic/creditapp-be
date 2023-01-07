import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';
import {
	renderInvitaitonMail as renderInvitaitonMailController,
} from 'controllers/templates';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/mail/invitation',
		controller: renderInvitaitonMailController,
	},
]);

export default router;
