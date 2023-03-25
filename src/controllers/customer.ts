import { RequestHandler } from 'express';

import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';

import Customer, { ICustomer } from 'models/customer';
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
			populate: 'spouse',
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
			// GENERAL INFORMATION
			firstName: customer?.firstName || contact?.firstName,
			middleName: customer?.middleName || contact?.middle_name_or_initial,
			lastName: customer?.lastName || contact?.lastName,
			salutation: customer?.salutation || contact?.salutation,
			birthday: customer?.birthday || contact?.date_of_birth,
			address: customer?.address || contact?.address,
			city: customer?.city || contact?.city,
			state: customer?.state || contact?.state,
			zip: customer?.zip || contact?.zip,
			phone: customer?.phone || contact?.phone,
			mobilePhone: customer?.mobilePhone || contact.mobilephone,
			referralSource: customer?.referralSource || contact.referral_company,

			// PERSONAL INFORMATION
			personalInfo: {
				driversLicenseId: customer?.personalInfo?.driversLicenseId || contact?.driver_s_license_number,
				driversLicenseIssueDate: customer?.personalInfo?.driversLicenseIssueDate || contact?.dl_issuance_date,
				driversLicenseExpireDate: customer?.personalInfo?.driversLicenseExpireDate || contact?.dl_expiration_date,
				creditUnion: customer?.personalInfo?.creditUnion || contact?.member_of_credit_union,
				personalBank: customer?.personalInfo?.personalBank || contact?.personal_banking_relationship,
				militaryStatus: customer?.personalInfo?.militaryStatus || contact?.current_military_affiliation,
				bankRoutingNumber: customer?.personalInfo?.bankRoutingNumber || contact?.routing_number,
				bankAccountNumber: customer?.personalInfo?.bankAccountNumber || contact?.account_number,
				creditRepairBefore: customer?.personalInfo?.creditRepairBefore || contact?.have_you_been_through_credit_repair_,
				judgementsLiensBankruptcy:
					customer?.personalInfo?.judgementsLiensBankruptcy || contact?.judgements_liens_bankruptcy_,
				previoiusFinanceCompany:
					customer?.personalInfo?.previoiusFinanceCompany ||
					contact?.have_you_worked_with_a_finance_company_like_ours_before_,
				maritalStatus: customer?.personalInfo?.maritalStatus || contact?.marital_status,
			},
			// HOUSING INFO
			housingInfo: {
				houstingStatus: customer?.housingInfo?.houstingStatus || contact?.housing_status,
				monthlyHousingPayment: customer?.housingInfo?.monthlyHousingPayment || contact?.monthly_housing_payment,
				estimatedLengthOfTimeAtResidence:
					customer?.housingInfo?.estimatedLengthOfTimeAtResidence || contact?.estimated_length_of_time_at_residence,
				moveInDate: customer?.housingInfo?.moveInDate || contact?.move_in_date,
				calculatedLengthOfTimeAtResidence:
					customer?.housingInfo?.calculatedLengthOfTimeAtResidence || contact?.calculated_length_of_time_at_residence,
				yearsAtCurrentAddress: customer?.housingInfo?.yearsAtCurrentAddress || contact?.years_at_current_address,
			},
			// EMPLOYMENT INFO
			employmentInfo: {
				incomeType: customer?.employmentInfo?.incomeType || contact?.income_type,
				employerName: customer?.employmentInfo?.employerName || contact?.employer,
				employerPhone: customer?.employmentInfo?.employerPhone || contact?.employer_phone_number,
				employerAddress: customer?.employmentInfo?.employerAddress || contact?.employer_address,
				estimatedTimeAtJob: customer?.employmentInfo?.estimatedTimeAtJob || contact?.estimated_time_at_job,
				startDateWithEmployer: customer?.employmentInfo?.startDateWithEmployer || contact?.start_date_with_employer,
				calculatedLengthOfEmployment:
					customer?.employmentInfo?.calculatedLengthOfEmployment || contact?.calculated_length_of_employment,
				occupationPosition: customer?.employmentInfo?.occupationPosition || contact?.occupation_position,
				monthlyGrossIncome: customer?.employmentInfo?.monthlyGrossIncome || contact?.monthly_gross_income,
				annualPersonalIncome: customer?.employmentInfo?.annualPersonalIncome || contact?.annual_personal_income,
				frontEndRtiRatio: customer?.employmentInfo?.frontEndRtiRatio || contact?.front_end_dti_ratio,
				totalAnnualHouseholdIncome:
					customer?.employmentInfo?.totalAnnualHouseholdIncome || contact?.total_annual_household_income,
				householdFrontEndDtiRatio:
					customer?.employmentInfo?.householdFrontEndDtiRatio || contact?.household_front_end_dti_ratio__cloned_,
				statedMonthlyIncome: customer?.employmentInfo?.statedMonthlyIncome || contact?.stated_monthly_income,
				statedAnnualIncome: customer?.employmentInfo?.statedAnnualIncome || contact?.stated_annual_income,
				statedAnnualHouseholdIncome:
					customer?.employmentInfo?.statedAnnualHouseholdIncome || contact?.stated_annual_household_income,
			},
			// SECURITY QUESTIONS
			securityQuestions: {
				birthCity: customer?.securityQuestions?.birthCity || contact?.birth_city,
				bronInForeignCountry:
					customer?.securityQuestions?.bronInForeignCountry || contact?.were_you_born_in_a_foreign_country_,
				legalPermanentResident:
					customer?.securityQuestions?.legalPermanentResident || contact?.are_you_a_legal_permanent_resident_,
				greenCardExpirationDate:
					customer?.securityQuestions?.greenCardExpirationDate || contact?.green_card_expiration_date,
				mothersMaidenName: customer?.securityQuestions?.mothersMaidenName || contact?.mother_s_maiden_name,
				highSchoolMascot: customer?.securityQuestions?.highSchoolMascot || contact?.high_school_mascot,
				highSchoolCity: customer?.securityQuestions?.highSchoolCity || contact?.high_school_city,
				nameOfStreetYouGrewUp:
					customer?.securityQuestions?.nameOfStreetYouGrewUp || contact?.name_of_street_you_grew_up_on,
				favoritePetsName: customer?.securityQuestions?.favoritePetsName || contact?.favorite_pet_s_name,
			},
			// EDUCATION
			educationInfo: {
				collegeAttended: customer?.educationInfo?.collegeAttended || contact?.college_university_attended,
				fieldOfStudy: customer?.educationInfo?.fieldOfStudy || contact?.field_of_study,
				degree: customer?.educationInfo?.degree || contact?.degree,
				graduatedDate: customer?.educationInfo?.graduatedDate || contact?.graduation_date,
				graduateSchoolAttended: customer?.educationInfo?.graduateSchoolAttended || contact?.graduate_school_attended,
				graduateSchoolFieldOfStudy:
					customer?.educationInfo?.graduateSchoolFieldOfStudy || contact?.graduate_school_field_of_study,
				graduateDegreeReceived: customer?.educationInfo?.graduateDegreeReceived || contact?.graduate_degree_received,
				graduateGraduationDate: customer?.educationInfo?.graduateGraduationDate || contact?.graduate_graduation_date,
			},
			// ASSET INFORMATION
			assetInfo: {
				combinedCheckingSavingsBalance:
					customer?.assetInfo?.combinedCheckingSavingsBalance || contact?.combined_checking_savings_balance,
				stocksBondsMutualFunds: customer?.assetInfo?.stocksBondsMutualFunds || contact?.stocks_bonds_mutual_funds,
				retirementAccountBalance: customer?.assetInfo?.retirementAccountBalance || contact?.retirement_account_balance,
			},
			// PRIMARY RESIDENCE VALUATION
			primaryResidenceValuation: {
				avmValue: customer?.primaryResidenceValuation?.avmValue || contact?.avm_in_response_com,
				marketValue: customer?.primaryResidenceValuation?.marketValue || contact?.market_value_in_response_com,
				zillowValue: customer?.primaryResidenceValuation?.zillowValue || contact?.zillow_value,
				estimatedPropertyValue:
					customer?.primaryResidenceValuation?.estimatedPropertyValue || contact?.estimated_property_value,
				calculatedValue: customer?.primaryResidenceValuation?.calculatedValue || contact?.calculated_value,
				calculatedEquity: customer?.primaryResidenceValuation?.calculatedEquity || contact?.calculated_equity,
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
