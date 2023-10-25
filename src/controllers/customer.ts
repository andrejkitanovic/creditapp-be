import { RequestHandler } from 'express';

import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';

import Customer, { ICustomer } from 'models/customer';
import Log from 'models/log';
import CreditEvaluation from 'models/creditEvaluation';
import LoanApplication from 'models/loanApplication';
import LoanPackage from 'models/loanPackage';

import { hsGetSingleContact, hsCreateContact, hsGetDealById, hsGetDealstageById } from './hubspot';
import { dayjsUnix } from 'utils/dayjs';
import { CBCApplicant, cbcPullCreditReport } from './cbc';
import xmlToJson from 'xml2json';
import fs from 'fs';
import { absoluteFilePath } from 'utils/absoluteFilePath';
import { htmlToPDF } from 'utils/htmlToPdf';
import { cbcReportToCreditEvaluation } from './creditEvaluation';
import dayjs from 'dayjs';
import i18n from 'helpers/i18n';

export const getCustomers: RequestHandler = async (req, res, next) => {
	try {
		const { organisation } = req.auth;

		let defaultFilters;
		if (organisation.type === 'partner') {
			defaultFilters = { leadSource: { $exists: true, $eq: organisation.leadSource } };
		}

		const { data: customers, count } = await queryFilter({
			Model: Customer,
			query: req.query,
			populate: 'spouse',
			searchFields: ['firstName', 'lastName', 'middleName', 'address', 'email'],
			defaultFilters,
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
			message: i18n.__('CONTROLLER.CUSTOMER.POST_CUSTOMER.ADDED'),
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
			mobilePhone,
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
			housingInfo,
			securityQuestions,
			primaryResidenceValuation,
			franchiseChoice,
			submissionEmail,
			submissionPassword,
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
			mobilePhone,
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
			housingInfo,
			securityQuestions,
			primaryResidenceValuation,
			franchiseChoice,
			submissionEmail,
			submissionPassword,
		});

		res.json({
			message: i18n.__('CONTROLLER.CUSTOMER.PUT_CUSTOMER.UPDATED'),
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
			message: i18n.__('CONTROLLER.CUSTOMER.PUT_CUSTOMER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteCustomerSpouse: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const customer = (await Customer.findById(id)) as ICustomer;

		await Customer.findByIdAndUpdate(customer.spouse, {
			spouse: null,
		});
		await Customer.findByIdAndUpdate(id, {
			spouse: null,
		});

		res.json({
			message: i18n.__('CONTROLLER.CUSTOMER_SPOUSE.DELETE_CUSTOMER.DELETED'),
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
			message: i18n.__('CONTROLLER.CUSTOMER.DELETE_CUSTOMER.DELETED'),
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

// export const putCustomerSyncHubspot: RequestHandler = async (req, res, next) => {
// 	try {
// 		const { id } = req.params;

// 		const customer = await Customer.findById(id);
// 		const contact = await hsGetContactById(customer?.hubspotId as string);

// 		await Customer.findByIdAndUpdate(id, {
// 			// GENERAL INFORMATION
// 			firstName: contact?.firstName,
// 			middleName: contact?.middle_name_or_initial,
// 			lastName: contact?.lastName,
// 			salutation: contact?.salutation,
// 			birthday: contact?.date_of_birth,
// 			address: contact?.address,
// 			city: contact?.city,
// 			state: contact?.state,
// 			zip: contact?.zip,
// 			phone: contact?.phone,
// 			mobilePhone: contact.mobilephone,
// 			referralSource: contact.referral_company,
// 			franchiseChoice: contact.franchise_Choice,

// 			// PERSONAL INFORMATION
// 			personalInfo: {
// 				driversLicenseId: contact?.driver_s_license_number,
// 				driversLicenseIssueDate: contact?.dl_issuance_date,
// 				driversLicenseExpireDate: contact?.dl_expiration_date,
// 				creditUnion: contact?.member_of_credit_union,
// 				personalBank: contact?.personal_banking_relationship,
// 				militaryStatus: contact?.current_military_affiliation,
// 				bankRoutingNumber: contact?.routing_number,
// 				bankAccountNumber: contact?.account_number,
// 				creditRepairBefore: contact?.have_you_been_through_credit_repair_,
// 				judgementsLiensBankruptcy: contact?.judgements_liens_bankruptcy_,
// 				previoiusFinanceCompany: contact?.have_you_worked_with_a_finance_company_like_ours_before_,
// 				maritalStatus: contact?.marital_status,
// 				fraudAlert: typeof contact?.fraud_alert === 'string' && contact?.fraud_alert === 'true',
// 				numberOfFraudAlert: contact?.number_on_fraud_alert_if_it_is_not_cell_phone_or_home_phone,
// 			},
// 			// HOUSING INFO
// 			housingInfo: {
// 				houstingStatus: contact?.housing_status,
// 				monthlyHousingPayment: contact?.monthly_housing_payment,
// 				estimatedLengthOfTimeAtResidence: contact?.estimated_length_of_time_at_residence,
// 				moveInDate: contact?.move_in_date,
// 				calculatedLengthOfTimeAtResidence: contact?.calculated_length_of_time_at_residence,
// 				yearsAtCurrentAddress: contact?.years_at_current_address,
// 			},
// 			// EMPLOYMENT INFO
// 			employmentInfo: {
// 				incomeType: contact?.income_type,
// 				employerName: contact?.employer,
// 				employerPhone: contact?.employer_phone_number,
// 				employerAddress: contact?.employer_address,
// 				estimatedTimeAtJob: contact?.estimated_time_at_job,
// 				startDateWithEmployer: contact?.start_date_with_employer,
// 				calculatedLengthOfEmployment: contact?.calculated_length_of_employment,
// 				occupationPosition: contact?.occupation_position,
// 				monthlyGrossIncome: contact?.monthly_gross_income,
// 				annualPersonalIncome: contact?.annual_personal_income,
// 				frontEndRtiRatio: contact?.front_end_dti_ratio,
// 				totalAnnualHouseholdIncome: contact?.total_annual_household_income,
// 				householdFrontEndDtiRatio: contact?.household_front_end_dti_ratio__cloned_,
// 				statedMonthlyIncome: contact?.stated_monthly_income,
// 				statedAnnualIncome: contact?.stated_annual_income,
// 				statedAnnualHouseholdIncome: contact?.stated_annual_household_income,
// 			},
// 			// SECURITY QUESTIONS
// 			securityQuestions: {
// 				birthCity: contact?.birth_city,
// 				bronInForeignCountry: contact?.were_you_born_in_a_foreign_country_,
// 				legalPermanentResident: contact?.are_you_a_legal_permanent_resident_,
// 				greenCardExpirationDate: contact?.green_card_expiration_date,
// 				mothersMaidenName: contact?.mother_s_maiden_name,
// 				highSchoolMascot: contact?.high_school_mascot,
// 				highSchoolCity: contact?.high_school_city,
// 				nameOfStreetYouGrewUp: contact?.name_of_street_you_grew_up_on,
// 				favoritePetsName: contact?.favorite_pet_s_name,
// 			},
// 			// EDUCATION
// 			educationInfo: {
// 				collegeAttended: contact?.college_university_attended,
// 				fieldOfStudy: contact?.field_of_study,
// 				degree: contact?.degree,
// 				graduatedDate: contact?.graduation_date,
// 				graduateSchoolAttended: contact?.graduate_school_attended,
// 				graduateSchoolFieldOfStudy: contact?.graduate_school_field_of_study,
// 				graduateDegreeReceived: contact?.graduate_degree_received,
// 				graduateGraduationDate: contact?.graduate_graduation_date,
// 			},
// 			// ASSET INFORMATION
// 			assetInfo: {
// 				combinedCheckingSavingsBalance: contact?.combined_checking_savings_balance,
// 				stocksBondsMutualFunds: contact?.stocks_bonds_mutual_funds,
// 				retirementAccountBalance: contact?.retirement_account_balance,
// 			},
// 			// PRIMARY RESIDENCE VALUATION
// 			primaryResidenceValuation: {
// 				avmValue: contact?.avm_in_response_com,
// 				marketValue: contact?.market_value_in_response_com,
// 				zillowValue: contact?.zillow_value,
// 				estimatedPropertyValue: contact?.estimated_property_value,
// 				calculatedValue: contact?.calculated_value,
// 				calculatedEquity: contact?.calculated_equity,
// 			},

// 			submissionEmail: contact?.submission_email,
// 			submissionPassword: contact?.submission_password,
// 		});

// 		res.json({});
// 	} catch (err) {
// 		next(err);
// 	}
// };

// export const putCustomerPushHubspot: RequestHandler = async (req, res, next) => {
// 	try {
// 		const { id } = req.params;

// 		const customer = await Customer.findById(id);

// 		if (customer?.hubspotId) {
// 			await hsUpdateContact(customer.hubspotId, customer);
// 		}

// 		res.json({});
// 	} catch (err) {
// 		next(err);
// 	}
// };

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

		if (
			htmlReport &&
			jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT !== 'True' &&
			!jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE FROZEN') &&
			!jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE LOCKED')
		) {
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

			const latestLog = await Log.findOne({ body: { $regex: `${customer?.email}`, $options: 'i' } })
				.sort('-createdAt')
				.lean();
			const latestLogBody = customer && latestLog && JSON.parse(latestLog.body);
			const dealId = latestLogBody?.dealId;
			// const leadSource = latestLogBody?.leadSource;

			let deal;
			let dealstage;
			if (dealId && dealId !== 'NODEALID') {
				deal = await hsGetDealById(dealId);

				if (deal?.dealstage) {
					dealstage = await hsGetDealstageById(deal.dealstage);
				}
			}

			await CreditEvaluation.create({
				customer: customer?._id,
				...creditEvaluationData,
				html: reportLink,
				pdf: reportPDFLink,
				leadSource: customer?.leadSource,
				state,
				statedMonthlyIncome: customer?.employmentInfo.statedMonthlyIncome,

				// Deal Related
				hubspotDealId: deal?.id,
				notes: deal?.underwriter_comments,
				dealStatus: dealstage?.label,
			});

			// let loanPackage;

			// if (deal) {
			// 	loanPackage = await LoanPackage.create({
			// 		customer: customer?._id,
			// 		leadSource,
			// 		creditEvaluation: creditEvaluation?._id,
			// 		hubspotId: deal?.id,
			// 		name: deal?.dealname,
			// 		loanAmount: deal?.amount,
			// 		monthlyPayment: deal?.monthly_payment,
			// 		term: deal?.term_months,
			// 		interestRate: deal?.interest_rate,
			// 		originationFee: deal?.origination_fee,
			// 	});
			// }

			await Customer.findByIdAndUpdate(id, {
				cbcErrorMessage: null,
			});
			res.json({});
		} else {
			let error = jsonResponse.XML_INTERFACE?.ERROR_DESCRIPT || 'Error';

			if (htmlReport && jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT === 'True') {
				// creditReportResponse.message = 'No hit';
			} else if (
				htmlReport &&
				jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE FROZEN')
			) {
				// creditReportResponse.message = 'File frozen';
				error = jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA;
			} else if (
				htmlReport &&
				jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE LOCKED')
			) {
				// creditReportResponse.message = 'File locked';
				error = jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA;
			}
			// creditReportResponse.message = 'Error while fetching report';

			// creditReportResponse.credit_inquiry_error_bureau = 'XPN';
			// creditReportResponse.loanly_status = 'Credit Report Error';

			await Customer.findByIdAndUpdate(id, {
				cbcErrorMessage: JSON.stringify(error),
			});
			res.json({});
		}
	} catch (err) {
		next(err);
	}
};
