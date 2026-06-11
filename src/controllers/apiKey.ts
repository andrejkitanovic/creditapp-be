import { RequestHandler } from 'express';
import crypto from 'crypto';

import ApiKey from 'models/apiKey';
import { PermissionsType } from 'helpers/permissions';

// External integrations (e.g. the HubSpot workflow) should only ever read credit evaluations.
const DEFAULT_PERMISSIONS: PermissionsType[] = ['read:credit-evaluations'];

const generateKey = () => `lz_${crypto.randomBytes(24).toString('hex')}`;
const hashKey = (key: string) => crypto.createHash('sha256').update(key).digest('hex');

export const postApiKey: RequestHandler = async (req, res, next) => {
	try {
		const { label, permissions, organisation } = req.body;

		const key = generateKey();

		const apiKey = await ApiKey.create({
			label,
			hashedKey: hashKey(key),
			prefix: key.slice(0, 11),
			permissions: permissions?.length ? permissions : DEFAULT_PERMISSIONS,
			organisation: organisation || req.auth.organisation?._id,
			createdBy: req.auth.id,
		});

		res.json({
			data: {
				id: apiKey._id,
				label: apiKey.label,
				prefix: apiKey.prefix,
				permissions: apiKey.permissions,
				// Plaintext key is returned ONCE here and never stored - copy it now.
				key,
			},
			message: 'API key created. Copy it now - it will not be shown again.',
		});
	} catch (err) {
		next(err);
	}
};

export const getApiKeys: RequestHandler = async (req, res, next) => {
	try {
		const apiKeys = await ApiKey.find()
			.select('-hashedKey')
			.populate('organisation', 'name')
			.sort({ createdAt: -1 })
			.lean();

		res.json({ data: apiKeys });
	} catch (err) {
		next(err);
	}
};

export const deleteApiKey: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await ApiKey.findByIdAndUpdate(id, { active: false });

		res.json({ message: 'API key revoked.' });
	} catch (err) {
		next(err);
	}
};
