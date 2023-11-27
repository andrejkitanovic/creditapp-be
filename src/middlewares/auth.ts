import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import i18n from 'helpers/i18n';
import User, { IUser, RoleType } from 'models/user';
import Organisation, { IOrganisation } from 'models/organisation';
import { LeanDocument } from 'mongoose';
import { PermissionsType, rolePermissions } from 'helpers/permissions';
import { hsGetUserById } from 'controllers/hubspot';

const hasPermissions = (permissions: PermissionsType[], role: RoleType) => {
	const userPermissions = rolePermissions[role];
	const missingPermission = permissions.some((permission) => !userPermissions.includes(permission));

	if (missingPermission) {
		return false;
	}

	return true;
};

const isOrganisationActive = async (organisation: LeanDocument<IOrganisation>) => {
	if (organisation.type === 'partner') {
		// Check is user still partner
		// Referral Partner Hubspot ID => 913574

		const { roleId } = await hsGetUserById(organisation.hubspotId);

		if (roleId !== '913574') {
			await Organisation.findByIdAndUpdate(organisation._id, {
				active: false,
			});

			return false;
		}

		return true;
	}

	return true;
};

const auth: (roles: RoleType[] | undefined, permissions: PermissionsType[] | undefined) => RequestHandler =
	(roles, permissions) => async (req, res, next) => {
		try {
			if (req?.headers?.authorization) {
				const authorization = req.headers.authorization.split(' ')[1];
				const decoded = jwt.verify(authorization, process.env.DECODE_KEY ?? '');

				const { id } = decoded as { id: string };
				const user = (await User.findById(id).lean()) as LeanDocument<IUser>;
				const organisation = (await Organisation.findById(user.organisation).lean()) as LeanDocument<IOrganisation>;
				const organisationActive = await isOrganisationActive(organisation);

				if (!user) {
					res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.USER_NOT_FOUND') });
				} else if (roles && !roles.includes(user.role)) {
					res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
				} else if (permissions?.length && !hasPermissions(permissions, user.role)) {
					res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
				} else if (!organisationActive) {
					res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.ORGANISATION_INACTIVE') });
				} else {
					req.auth = {
						id,
						organisation,
					};
					next();
				}
			} else res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.MISSING_TOKEN') });
		} catch (err) {
			res.status(500).json({ message: i18n.__('GLOBAL.ERROR.NETWORK') });
		}
	};

export default auth;
