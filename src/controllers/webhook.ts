import xmlToJson from 'xml2json';
import dayjs from 'dayjs';
import fs from 'fs';
import { RequestHandler } from 'express';

import { CBCApplicant, 
	cbcPostCreditReport
 } from './cbc';
import Customer from 'models/customer';
import { absoluteFilePath } from 'utils/absoluteFilePath';

export const postWebhookCustomer: RequestHandler = async (req, res, next) => {
	try {
		const nowUnix = dayjs().unix();
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

		const cbcApplicant: CBCApplicant = {
			personalBusiness: 'personal',
			firstName,
			middleName: '',
			lastName,
			email,
			birthdate: dayjs(birthday).format('MM/DD/YYYY'),
			ssn: social,
			address: {
				line: address,
				city,
				state,
				postalCode: zip,
			},
		};

		// CBC CALL
		const cbcResponse = await cbcPostCreditReport(cbcApplicant);
		const jsonResponse = JSON.parse(xmlToJson.toJson(cbcResponse.data));
		const htmlReport = jsonResponse.XML_INTERFACE.CREDITREPORT.REPORT;

		const reportName = `./uploads/${hubspotId}-${nowUnix}_credit-report.html`;
		fs.writeFile(reportName, htmlReport, (err) => {
			next(err);
		});

		res.json({
			message: 'Successfully created user',
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
			credit_eval_link: absoluteFilePath(req, reportName),
			credit_eval_date: nowUnix,
		});
	} catch (err) {
		next(err);
	}
};

// export const postWebhookCreditEvaluation: RequestHandler = async (req, res, next) => {
// 	try {
// 		const { applicant, sale } = req.body;

// 		const cbcResponse = await cbcGenerateCreditApplication(applicant, sale);

// 		const jsonResponse = JSON.parse(xmlToJson.toJson(cbcResponse.data));
// 		const htmlReport = jsonResponse.XML_INTERFACE.CREDITREPORT.REPORT;

// 		res.json({
// 			message: 'Successfully created credit evaluation',
// 			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
// 		});
// 	} catch (err) {
// 		next(err);
// 	}
// };
