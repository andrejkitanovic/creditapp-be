import xmlToJson from 'xml2json';
import dayjs from 'dayjs';
import fs from 'fs';
import { RequestHandler } from 'express';

import { CBCApplicant, cbcPullCreditReport } from './cbc';
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
		const cbcResponse = await cbcPullCreditReport(cbcApplicant);
		const jsonResponse = JSON.parse(xmlToJson.toJson(cbcResponse.data));

		const htmlReport = jsonResponse.XML_INTERFACE?.CREDITREPORT?.REPORT;

		const creditReportResponse: { [key: string]: any } = {
			loanly_recent_report_date: nowUnix,
		};

		if (htmlReport) {
			const reportName = `./uploads/${hubspotId}-${nowUnix}_credit-report.html`;
			fs.writeFile(reportName, htmlReport, (err) => {
				next(err);
			});

			creditReportResponse.loanly_recent_report = absoluteFilePath(req, reportName);
			creditReportResponse.loanly_status = 'Credit Report Successful';
		} else {
			creditReportResponse.credit_inquiry_error = jsonResponse.XML_INTERFACE?.ERROR_DESCRIPT || 'Error';
			creditReportResponse.credit_inquiry_error_bureau = 'XPN';
			creditReportResponse.loanly_status = 'Credit Report Error';
		}

		res.json({
			message: 'Successfully created user',
			...creditReportResponse,
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
