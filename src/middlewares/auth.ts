import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import i18n from 'helpers/i18n';
import User, { IUser, RoleType } from 'models/user';
import Organisation, { IOrganisation } from 'models/organisation';
import { LeanDocument } from 'mongoose';

const auth: (roles: RoleType[]) => RequestHandler = (roles) => async (req, res, next) => {
	try {
		if (req?.headers?.authorization) {
			const authorization = req.headers.authorization.split(' ')[1];
			const decoded = jwt.verify(authorization, process.env.DECODE_KEY ?? '');

			const { id } = decoded as { id: string };
			const user = (await User.findById(id).lean()) as LeanDocument<IUser>;
			const organisation = (await Organisation.findById(user.organisation).lean()) as LeanDocument<IOrganisation>;

			if (!user) {
				res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.USER_NOT_FOUND') });
			} else if (!roles.includes(user.role)) {
				if (organisation.type === 'partner') {
					if (organisation.active) {
						// Check is user still partner
						// Referral Partner Hubspot ID => 611058
					} else if (!organisation.active) {
						res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.ORGANISATION_INACTIVE') });
					}
				}

				res.status(403).json({ message: i18n.__('MIDDLEWARE.AUTH.NOT_AUTHORIZED') });
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
