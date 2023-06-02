import { Router } from 'express';
import defineRoutes from 'helpers/defineRoutes';

import { getLogs as getLogsController } from 'controllers/log';
// import {
// } from 'validators/log';

const router = Router();
defineRoutes(router, [
	{
		method: 'get',
		route: '/',
		permissions: ['read:logs'],
		controller: getLogsController,
	},
]);

export default router;
