import { RequestHandler } from 'express';
import i18n from 'i18n';
import path from 'path';

export const defaultLocale = 'en';

i18n.configure({
	locales: ['en'],
	defaultLocale,
	header: 'accept-language',
	directory: path.join(__dirname, '../', 'locales'),
});

export const i18nMiddleware: RequestHandler = (req, res, next) => {
	const { headers } = req;
	const language = headers['accept-language'];

	if (language) {
		i18n.setLocale(language);
	}

	next();
};

export default i18n;
