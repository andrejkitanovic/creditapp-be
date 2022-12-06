import { IRouter, RequestHandler } from 'express';
import { ValidationChain } from 'express-validator';

import validatorMiddleware from 'middlewares/validator';
import auth from 'middlewares/auth';
import loggerMiddleware from 'middlewares/logger';
import { RoleType } from 'models/user';
import { PermissionsType } from 'helpers/permissions';

interface IRoute {
	method: 'get' | 'post' | 'put' | 'patch' | 'delete';
	route: string;
	roles?: RoleType[];
	middlewares?: RequestHandler[];
	permissions?: PermissionsType[];
	validator?: ValidationChain[];
	controller: RequestHandler;
}

const defineRoutes = (router: IRouter, routes: IRoute[]) => {
	routes.forEach(({ method, route, roles, middlewares, validator, controller }) => {
		const additionalRoutes = [];

		if (roles) {
			additionalRoutes.push(auth(roles));
		}
		if (validator) {
			additionalRoutes.push(validator, validatorMiddleware);
		}
		if (middlewares) {
			additionalRoutes.push(middlewares);
		}

		router[method](route, loggerMiddleware, ...additionalRoutes, controller);
	});
};

export default defineRoutes;
