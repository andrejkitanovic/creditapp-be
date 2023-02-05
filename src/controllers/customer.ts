import { RequestHandler } from 'express';

import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';

import Customer from 'models/customer';
import CreditEvaluation from 'models/creditEvaluation';
import LoanApplication from 'models/loanApplication';
import LoanPackage from 'models/loanPackage';

import { hsGetSingleContact, hsCreateContact, hsGetContactById, hsUpdateContact } from './hubspot';
import { dayjsUnix } from 'utils/dayjs';
import { CBCApplicant, cbcPullCreditReport } from './cbc';
import xmlToJson from 'xml2json';
import fs from 'fs';
import { absoluteFilePath } from 'utils/absoluteFilePath';
import { htmlToPDF } from 'utils/htmlToPdf';
import { cbcReportToCreditEvaluation } from './creditEvaluation';
import dayjs from 'dayjs';

export const getCustomers: RequestHandler = async (req, res, next) => {
	try {
		const { data: customers, count } = await queryFilter({
			Model: Customer,
			query: req.query,
			searchFields: ['firstName', 'lastName', 'middleName', 'address', 'email'],
		});

		res.json({
			data: customers,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const getHSCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { email } = req.query;

		const { total, results } = await hsGetSingleContact('email', email as string);

		let customer = null;

		if (total) {
			const { firstname, lastname } = results[0].properties;

			customer = {
				firstName: firstname,
				lastName: lastname,
			};
		}

		res.json({
			data: customer,
		});
	} catch (err) {
		next(err);
	}
};

export const postCustomer: RequestHandler = async (req, res, next) => {
	try {
		const {
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralSource,
			leadSource,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		} = req.body;

		const { total, results } = await hsGetSingleContact('email', email);

		let hubspotId;
		if (total) {
			hubspotId = results[0].id;
		} else {
			const hubspotUser = await hsCreateContact(req.body);
			hubspotId = hubspotUser.id;
		}

		await Customer.create({
			hubspotId,
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralSource,
			leadSource,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const {
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralSource,
			leadSource,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		} = req.body;

		await Customer.findByIdAndUpdate(id, {
			firstName,
			lastName,
			middleName,
			address,
			city,
			state,
			zip,
			phone,
			social,
			email,
			birthday,
			referralSource,
			leadSource,
			associatedBrand,
			personalInfo,
			educationInfo,
			employmentInfo,
			assetInfo,
		});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.PUT_PARTNER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putCustomerSpouse: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { spouse } = req.body;

		await Customer.findByIdAndUpdate(id, {
			spouse,
		});
		await Customer.findByIdAndUpdate(spouse, {
			spouse: id,
		});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.PUT_PARTNER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await Customer.findByIdAndDelete(id);

		const creditEvaluations = await CreditEvaluation.find({ customer: id });
		for await (const creditEvaluation of creditEvaluations) {
			await LoanApplication.remove({ creditEvaluation: creditEvaluation?._id });
		}
		await CreditEvaluation.remove({ customer: id });
		await LoanPackage.remove({ customer: id });

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.DELETE_PARTNER.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const customer = await Customer.findById(id).populate('spouse');

		res.json({
			data: customer,
		});
	} catch (err) {
		next(err);
	}
};

export const putCustomerSyncHubspot: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const customer = await Customer.findById(id);
		const contact = await hsGetContactById(customer?.hubspotId as string);

		await Customer.findByIdAndUpdate(id, {
			firstName: customer?.firstName || contact?.firstName,
			lastName: customer?.lastName || contact?.lastName,
			address: customer?.address || contact?.address,
			city: customer?.city || contact?.city,
			state: customer?.state || contact?.state,
			zip: customer?.zip || contact?.zip,
			phone: customer?.phone || contact?.mobilephone,
			// birthday: customer?.birthday || contact?.date_of_birth,
			referralSource: customer?.referralSource || contact?.referred_by,
			// leadSource,
			personalInfo: {
				placeOfBirth: customer?.personalInfo?.placeOfBirth || contact?.birth_city,
				mothersMaidenName: customer?.personalInfo?.mothersMaidenName || contact?.mother_s_maiden_name,
				nameOfPet: customer?.personalInfo?.nameOfPet || contact?.favorite_pet_s_name,
				monthlyHomeCost: customer?.personalInfo?.monthlyHomeCost || contact?.monthly_housing_payment,
				personalMonthlyIncome: customer?.personalInfo?.personalMonthlyIncome || contact?.monthly_housing_payment,
				householdAnnualIncome: customer?.personalInfo?.householdAnnualIncome || contact?.monthly_gross_income,
				creditUnion: customer?.personalInfo?.creditUnion || contact?.credit_union_login,
				militaryStatus: customer?.personalInfo?.militaryStatus || contact?.military_status,
				bankRoutingNumber: customer?.personalInfo?.bankRoutingNumber || contact?.routing_number,
				bankAccountNumber: customer?.personalInfo?.bankAccountNumber || contact?.account_number,
				bankruptcy: customer?.personalInfo?.bankruptcy || contact?.judgements_liens_bankruptcy_,
			},
			educationInfo: {
				collegeAttended: customer?.educationInfo?.collegeAttended || contact?.college_university_attended,
				fieldOfStudy: customer?.educationInfo?.fieldOfStudy || contact?.field_of_study,
				degree: customer?.educationInfo?.degree || contact?.degree,
				// graduatedDate: customer?.educationInfo?.graduatedDate || contact?.graduation_date,
			},
			employmentInfo: {
				employerName: customer?.employmentInfo?.employerName || contact?.employer,
				employerPhone: customer?.employmentInfo?.employerPhone || contact?.employer_phone_number,
				startDate: customer?.employmentInfo?.startDate || contact?.start_date_with_employer,
				jobTitle: customer?.employmentInfo?.jobTitle || contact?.jobtitle,
			},
			assetInfo: {
				retirementBalance: customer?.assetInfo?.retirementBalance || contact?.retirement_account_balance,
				avmValue: customer?.assetInfo?.avmValue || contact?.calculated_real_estate_value,
				marketValue: customer?.assetInfo?.marketValue || contact?.market_value_in_response_com,
				zillowValue: customer?.assetInfo?.zillowValue || contact?.zillow_value,
				estimatedEquity: customer?.assetInfo?.estimatedEquity || contact?.calculated_equity,
				estimatedValue: customer?.assetInfo?.estimatedValue || contact?.estimated_property_value,
				// realEquity: customer?.assetInfo?.realEquity || contact?.calculated_equity,
			},
		});

		res.json({});
	} catch (err) {
		next(err);
	}
};

export const putCustomerPushHubspot: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const customer = await Customer.findById(id);

		if (customer?.hubspotId) {
			await hsUpdateContact(customer.hubspotId, customer);
		}

		res.json({});
	} catch (err) {
		next(err);
	}
};

export const putRefetchCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { firstName, lastName, middleName, address, city, state, zip, phone, social, email, birthday } = req.body;

		const customer = await Customer.findByIdAndUpdate(
			id,
			{
				firstName,
				lastName,
				middleName,
				address,
				city,
				state,
				zip,
				phone,
				social,
				email,
				birthday,
			},
			{ new: true }
		);

		const cbcApplicant: CBCApplicant = {
			personalBusiness: 'personal',
			firstName: customer?.firstName || '',
			middleName: customer?.middleName || '',
			lastName: customer?.lastName || '',
			email: customer?.email || '',
			//@ts-expect-error
			birthdate: dayjsUnix(customer?.birthday).format('MM/DD/YYYY'),
			ssn: customer?.social || '',
			address: {
				line: customer?.address || '',
				city: customer?.city || '',
				state: customer?.state || '',
				postalCode: customer?.zip || '',
			},
		};

		// CBC CALL
		const cbcResponse = await cbcPullCreditReport(cbcApplicant);
		const jsonResponse = JSON.parse(xmlToJson.toJson(cbcResponse.data));

		const htmlReport = jsonResponse.XML_INTERFACE?.CREDITREPORT?.REPORT;

		if (htmlReport && jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT !== 'True') {
			const nowUnix = dayjs().unix();
			const reportName = `./uploads/${customer?.hubspotId}-${nowUnix}_credit-report.html`;
			fs.writeFileSync(reportName, htmlReport);
			const reportLink = absoluteFilePath(req, reportName);

			const pdfReport = await htmlToPDF(reportName);
			const reportPDFName = reportName.replace('html', 'pdf');
			fs.writeFileSync(reportPDFName, pdfReport);
			const reportPDFLink = absoluteFilePath(req, reportPDFName);

			await Customer.findByIdAndUpdate(customer?._id, {
				cbcErrorMessage: undefined,
			});

			const reportData = jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE;

			// Create Credit Evaluation
			const creditEvaluationData = cbcReportToCreditEvaluation(reportData);
			const creditEvaluation = await CreditEvaluation.create({
				customer: customer?._id,
				...creditEvaluationData,
				html: reportLink,
				pdf: reportPDFLink,
				state,
			});
			console.log(creditEvaluation);

			// if (dealId) {
			// 	const deal = await hsGetDealById(dealId);

			// 	if (deal) {
			// 		await LoanPackage.create({
			// 			customer: customer?._id,
			// 			creditEvaluation: creditEvaluation?._id,
			// 			hubspotId: deal?.id,
			// 			name: deal?.dealname,
			// 			loanAmount: deal?.amount,
			// 			monthlyPayment: deal?.monthly_payment,
			// 			term: deal?.term_months,
			// 			interestRate: deal?.interest_rate,
			// 			originationFee: deal?.origination_fee,
			// 		});
			// 	}
			// }

			await Customer.findByIdAndUpdate(id, {
				cbcErrorMessage: null,
			});
			res.json({});
		} else {
			res.json({});
		}
	} catch (err) {
		next(err);
	}
};
