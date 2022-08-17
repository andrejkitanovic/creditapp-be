import { RequestHandler } from 'express';
import { cbcGenerateCreditApplication } from './cbc';
import xmlToJson from 'xml2json';
import Customer from 'models/customer';

export const postWebhookCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { hubspotId, firstName, lastName, address, social, email, city, state, zip, birthday, associatedBrand } =
			req.body;

		await Customer.create({
			hubspotId,
			firstName,
			lastName,
			address,
			city,
			state,
			zip,
			social,
			email,
			birthday,
			associatedBrand,
			personalInfo: {},
			educationInfo: {},
			employmentInfo: {},
			assetInfo: {},
		});

		res.json({
			message: 'Successfully created user',
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const postWebhookCreditEvaluation: RequestHandler = async (req, res, next) => {
	try {
		const { applicant, sale } = req.body;

		const cbcResponse = await cbcGenerateCreditApplication(applicant, sale);

		const jsonResponse = JSON.parse(xmlToJson.toJson(cbcResponse.data));
		const htmlReport = jsonResponse.XML_INTERFACE.CREDITREPORT.REPORT;

		res.json({
			message: 'Successfully created credit evaluation',
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};
