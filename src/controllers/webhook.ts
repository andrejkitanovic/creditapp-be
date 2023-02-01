import xmlToJson from 'xml2json';
import dayjs from 'dayjs';
import fs from 'fs';
import { RequestHandler } from 'express';

import { CBCApplicant, cbcPullCreditReport } from './cbc';

import LoanPackage from 'models/loanPackage';
import CreditEvaluation from 'models/creditEvaluation';
import Customer from 'models/customer';

import { absoluteFilePath } from 'utils/absoluteFilePath';
import { cbcReportToCreditEvaluation } from './creditEvaluation';
import { dayjsUnix } from 'utils/dayjs';
import { hsGetDealById } from './hubspot';
import { htmlToPDF } from 'utils/htmlToPdf';

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
			referralSource,
			leadSource,
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
				referralSource,
				leadSource,
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

		let creditEvaluation;
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

			creditReportResponse.loanly_customer = `https://app.loanly.ai/customers/${customer?._id}`;

			if (
				htmlReport &&
				jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT !== 'True' &&
				!jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE FROZEN')
			) {
				const reportName = `./uploads/${hubspotId}-${nowUnix}_credit-report.html`;
				fs.writeFileSync(reportName, htmlReport);
				const reportLink = absoluteFilePath(req, reportName);

				const pdfReport = await htmlToPDF(reportName);
				const reportPDFName = reportName.replace('html', 'pdf');
				fs.writeFileSync(reportPDFName, pdfReport);
				const reportPDFLink = absoluteFilePath(req, reportPDFName);

				creditReportResponse.message = 'Successfully created user';

				creditReportResponse.loanly_recent_report = reportLink;
				creditReportResponse.loanly_recent_report_pdf = reportPDFLink;
				creditReportResponse.loanly_status = 'Credit Report Successful';

				await Customer.findByIdAndUpdate(customer._id, {
					cbcErrorMessage: undefined,
				});

				const reportData = jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE;

				// Create Credit Evaluation
				const creditEvaluationData = cbcReportToCreditEvaluation(reportData);

				creditReportResponse.credit_score = parseInt(reportData.SCORES.SCORE) ?? 0;

				creditEvaluation = await CreditEvaluation.create({
					customer: customer._id,
					...creditEvaluationData,
					html: reportLink,
					pdf: reportPDFLink,
					state,
				});

				let loanPackage;
				if (dealId) {
					const deal = await hsGetDealById(dealId);

					if (deal) {
						loanPackage = await LoanPackage.create({
							customer: customer._id,
							creditEvaluation: creditEvaluation?._id,
							hubspotId: deal?.id,
							name: deal?.dealname,
							loanAmount: deal?.amount,
							monthlyPayment: deal?.monthly_payment,
							term: deal?.term_months,
							interestRate: deal?.interest_rate,
							originationFee: deal?.origination_fee,
						});
					}
				}

				creditReportResponse.loanly_credit_evaluation = `https://app.loanly.ai/credit-evaluations/${creditEvaluation?._id}`;

				if (loanPackage) {
					creditReportResponse.loanly_loan_package = `https://app.loanly.ai/loan-packages/${loanPackage?._id}`;
				}
			} else {
				creditReportResponse.credit_inquiry_error = jsonResponse.XML_INTERFACE?.ERROR_DESCRIPT || 'Error';

				if (htmlReport && jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT === 'True') {
					creditReportResponse.message = 'No hit';
				} else if (
					htmlReport &&
					jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE FROZEN')
				) {
					creditReportResponse.message = 'File frozen';
					creditReportResponse.credit_inquiry_error =
						jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA;
				} else creditReportResponse.message = 'Error while fetching report';

				creditReportResponse.credit_inquiry_error_bureau = 'XPN';
				creditReportResponse.loanly_status = 'Credit Report Error';

				await Customer.findByIdAndUpdate(customer._id, {
					cbcErrorMessage: JSON.stringify(creditReportResponse.credit_inquiry_error),
				});
			}
		} else {
			creditEvaluation = await CreditEvaluation.findOne({
				customer: customer._id,
				reportDate: { $gte: dayjs().subtract(30, 'day').toDate() },
			});

			creditReportResponse.loanly_customer = `https://app.loanly.ai/customers/${customer?._id}`;
			creditReportResponse.message = 'Successfully recalled user';
			creditReportResponse.credit_score =
				creditEvaluation?.creditScores.find((creditScore) => creditScore.type === 'XPN')?.score ?? 0;
			creditReportResponse.loanly_recent_report_date = dayjs(creditEvaluation?.reportDate).unix();
			creditReportResponse.loanly_recent_report = creditEvaluation?.html;
			creditReportResponse.loanly_recent_report_pdf = creditEvaluation?.pdf;

			creditReportResponse.loanly_credit_evaluation = `https://app.loanly.ai/credit-evaluations/${creditEvaluation?._id}`;

			const loanPackage = await LoanPackage.findOne({ creditEvaluation: creditEvaluation?._id || '' });
			if (loanPackage) {
				creditReportResponse.loanly_loan_package = `https://app.loanly.ai/loan-packages/${loanPackage?._id}`;
			}

			creditReportResponse.loanly_status = 'Credit Report Recalled';
		}

		res.json({
			...creditReportResponse,
		});
	} catch (err) {
		console.log(err);
		next(err);
	}
};
