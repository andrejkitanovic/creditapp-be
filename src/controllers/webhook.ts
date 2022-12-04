import xmlToJson from 'xml2json';
import dayjs from 'dayjs';
import fs from 'fs';
import { RequestHandler } from 'express';
import htmlToPDF from 'html-pdf-node';

import { CBCApplicant, cbcPullCreditReport } from './cbc';
import CreditEvaluation from 'models/creditEvaluation';
import Customer from 'models/customer';
import { absoluteFilePath } from 'utils/absoluteFilePath';
import { cbcReportToCreditEvaluation } from './creditEvaluation';

export const postWebhookCustomer: RequestHandler = async (req, res, next) => {
	try {
		const nowUnix = dayjs().unix();
		const { hubspotId, firstName, lastName, address, social, email, city, state, zip, birthday, associatedBrand } =
			req.body;

		// Create customer
		const customer = await Customer.create({
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

		const pdfReport = await htmlToPDF.generatePdf(
			{ content: htmlReport },
			{ format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] }
		);

		const creditReportResponse: { [key: string]: any } = {
			loanly_recent_report_date: nowUnix,
		};

		if (htmlReport && jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT !== 'True') {
			const reportName = `./uploads/${hubspotId}-${nowUnix}_credit-report.html`;
			fs.writeFile(reportName, htmlReport, (err) => {
				next(err);
			});
			const reportLink = absoluteFilePath(req, reportName);

			const reportPDFName = reportName.replace('html', 'pdf');
			fs.writeFile(reportPDFName, pdfReport as unknown as Buffer, (err) => {
				next(err);
			});
			const reportPDFLink = absoluteFilePath(req, reportPDFName);

			creditReportResponse.message = 'Successfully created user';
			creditReportResponse.loanly_recent_report = reportLink;
			creditReportResponse.loanly_recent_report_pdf = reportPDFLink;
			creditReportResponse.loanly_status = 'Credit Report Successful';

			const reportData = jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE;

			// Create Credit Evaluation
			const creditEvaluationData = cbcReportToCreditEvaluation(reportData);
			CreditEvaluation.create({
				customer: customer._id,
				...creditEvaluationData,
				html: reportLink,
				state,
			});
		} else {
			if (htmlReport && jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT === 'True') {
				creditReportResponse.message = 'No hit';
			} else creditReportResponse.message = 'Error while fetching report';

			creditReportResponse.credit_inquiry_error = jsonResponse.XML_INTERFACE?.ERROR_DESCRIPT || 'Error';
			creditReportResponse.credit_inquiry_error_bureau = 'XPN';
			creditReportResponse.loanly_status = 'Credit Report Error';
		}

		res.json({
			...creditReportResponse,
		});
	} catch (err) {
		next(err);
	}
};
