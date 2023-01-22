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
import { dayjsUnix } from 'utils/dayjs';
import { hsGetDealById } from './hubspot';

export const postWebhookCustomer: RequestHandler = async (req, res, next) => {
	try {
		let shouldPullCBC = true;
		const nowUnix = dayjs().unix();
		const {
			hubspotId,
			dealId,
			firstName,
			lastName,
			address,
			social,
			email,
			city,
			state,
			zip,
			birthday,
			associatedBrand,
			sendForce,
		} = req.body;

		// Search if customer exists
		let customer = await Customer.findOne({ email });

		if (!customer) {
			// Create customer
			customer = await Customer.create({
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
		} else {
			if (!sendForce) {
				shouldPullCBC = !(await CreditEvaluation.exists({
					customer: customer._id,
					reportDate: { $gte: dayjs().subtract(30, 'day').toDate() },
				}));
			}
		}

		const creditReportResponse: { [key: string]: any } = {
			loanly_recent_report_date: nowUnix,
		};

		if (shouldPullCBC) {
			const cbcApplicant: CBCApplicant = {
				personalBusiness: 'personal',
				firstName,
				middleName: '',
				lastName,
				email,
				birthdate: dayjsUnix(birthday).format('MM/DD/YYYY'),
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
					pdf: reportPDFLink,
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
		} else {
			const creditEvaluation = await CreditEvaluation.findOne({
				customer: customer._id,
				reportDate: { $gte: dayjs().subtract(30, 'day').toDate() },
			});

			creditReportResponse.message = 'Successfully recalled user';
			creditReportResponse.loanly_recent_report_date = dayjs(creditEvaluation?.reportDate).unix();
			creditReportResponse.loanly_recent_report = creditEvaluation?.html;
			creditReportResponse.loanly_recent_report_pdf = creditEvaluation?.pdf;
			creditReportResponse.loanly_status = 'Credit Report Recalled';
		}

		if (dealId) {
			const deal = await hsGetDealById(dealId);
			console.log(deal);
		}

		res.json({
			...creditReportResponse,
		});
	} catch (err) {
		console.log(err);
		next(err);
	}
};
