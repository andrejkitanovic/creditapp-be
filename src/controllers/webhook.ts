import xmlToJson from 'xml2json';
import dayjs from 'dayjs';
import fs from 'fs';
import { RequestHandler } from 'express';

import { CBCApplicant, cbcPullCreditReport } from './cbc';

import LoanPackage from 'models/loanPackage';
import CreditEvaluation, { CreditEvaluationAffordabilityEnum } from 'models/creditEvaluation';
import Customer from 'models/customer';

import { absoluteFilePath } from 'utils/absoluteFilePath';
import { cbcReportToCreditEvaluation } from './creditEvaluation';
import { hsGetContactById, hsGetDealById, hsGetDealstageById } from './hubspot';
import { htmlToPDF } from 'utils/htmlToPdf';
import { omitBy, isNil } from 'lodash';

const hsAffordabilities = {
	'Pending Eval': CreditEvaluationAffordabilityEnum.PENDING_EVAL,
	Low: CreditEvaluationAffordabilityEnum.LOW,
	Medium: CreditEvaluationAffordabilityEnum.MEDIUM,
	High: CreditEvaluationAffordabilityEnum.HIGH,
};

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
			dateOfBirthString,
			associatedBrand,
			sendForce,
			referralSource,
			leadSource,
			statedMonthlyIncome,
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
				birthdate: dateOfBirthString,
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
			// writeFileSync('response.json', JSON.stringify(jsonResponse));

			const htmlReport = jsonResponse.XML_INTERFACE?.CREDITREPORT?.REPORT;

			creditReportResponse.loanly_customer = `https://app.loanly.ai/customers/${customer?._id}`;

			if (
				htmlReport &&
				jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.NOHIT !== 'True' &&
				!jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE FROZEN') &&
				!jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE LOCKED')
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

				creditReportResponse.credit_score = parseInt(reportData.SCORES?.SCORE) ?? 0;

				let deal;
				let dealstage;
				if (dealId && dealId !== 'NODEALID') {
					deal = await hsGetDealById(dealId);

					if (deal?.dealstage) {
						dealstage = await hsGetDealstageById(deal.dealstage);
					}
				}

				creditEvaluation = await CreditEvaluation.create({
					customer: customer._id,
					leadSource,
					...creditEvaluationData,
					html: reportLink,
					pdf: reportPDFLink,
					state,
					statedMonthlyIncome,

					// Deal Related
					hubspotDealId: deal?.id,
					notes: deal?.underwriter_comments,
					dealStatus: dealstage?.label,
				});

				let loanPackage;

				if (deal) {
					loanPackage = await LoanPackage.create({
						customer: customer._id,
						leadSource,
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

				if (creditEvaluation.declineReasonCodes) {
					creditReportResponse.decline_reason_codes = creditEvaluation.declineReasonCodes.join(';');
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
				} else if (
					htmlReport &&
					jsonResponse.XML_INTERFACE.CREDITREPORT.BUREAU_TYPE?.RAWDATA?.DATA?.includes('FILE LOCKED')
				) {
					creditReportResponse.message = 'File locked';
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

			if (creditEvaluation?.declineReasonCodes) {
				creditReportResponse.decline_reason_codes = creditEvaluation.declineReasonCodes.join(';');
			}

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
		next(err);
	}
};

export const putSyncCustomer: RequestHandler = async (req, res, next) => {
	try {
		const { hubspotId } = req.params;

		const customer = await Customer.findOne({ hubspotId });

		if (!customer) {
			res.json({
				message: 'No Customer Found!',
			});
		} else {
			const contact = await hsGetContactById(hubspotId as string);

			const updateContactProperties = omitBy(
				{
					// GENERAL INFORMATION
					firstName: contact?.firstName,
					middleName: contact?.middle_name_or_initial,
					lastName: contact?.lastName,
					salutation: contact?.salutation,
					birthday: contact?.date_of_birth,
					address: contact?.address,
					city: contact?.city,
					state: contact?.state,
					zip: contact?.zip,
					phone: contact?.phone,
					mobilePhone: contact.mobilephone,
					referralSource: contact.referral_company,
					franchiseChoice: contact.franchise_Choice,

					// PERSONAL INFORMATION
					'personalInfo.driversLicenseId': contact?.driver_s_license_number,
					'personalInfo.driversLicenseIssueDate': contact?.dl_issuance_date,
					'personalInfo.driversLicenseExpireDate': contact?.dl_expiration_date,
					'personalInfo.creditUnion': contact?.member_of_credit_union,
					'personalInfo.personalBank': contact?.personal_banking_relationship,
					'personalInfo.militaryStatus': contact?.current_military_affiliation,
					'personalInfo.bankRoutingNumber': contact?.routing_number,
					'personalInfo.bankAccountNumber': contact?.account_number,
					'personalInfo.creditRepairBefore': contact?.have_you_been_through_credit_repair_,
					'personalInfo.judgementsLiensBankruptcy': contact?.judgements_liens_bankruptcy_,
					'personalInfo.previoiusFinanceCompany': contact?.have_you_worked_with_a_finance_company_like_ours_before_,
					'personalInfo.maritalStatus': contact?.marital_status,
					'personalInfo.fraudAlert': typeof contact?.fraud_alert === 'string' && contact?.fraud_alert === 'true',
					'personalInfo.numberOfFraudAlert': contact?.number_on_fraud_alert_if_it_is_not_cell_phone_or_home_phone,

					// HOUSING INFO
					'housingInfo.houstingStatus': contact?.housing_status,
					'housingInfo.monthlyHousingPayment': contact?.monthly_housing_payment,
					'housingInfo.estimatedLengthOfTimeAtResidence': contact?.estimated_length_of_time_at_residence,
					'housingInfo.moveInDate': contact?.move_in_date,
					'housingInfo.calculatedLengthOfTimeAtResidence': contact?.calculated_length_of_time_at_residence,
					'housingInfo.yearsAtCurrentAddress': contact?.years_at_current_address,

					// EMPLOYMENT INFO
					'employmentInfo.incomeType': contact?.income_type,
					'employmentInfo.employerName': contact?.employer,
					'employmentInfo.employerPhone': contact?.employer_phone_number,
					'employmentInfo.employerAddress': contact?.employer_address,
					'employmentInfo.estimatedTimeAtJob': contact?.estimated_time_at_job,
					'employmentInfo.startDateWithEmployer': contact?.start_date_with_employer,
					'employmentInfo.calculatedLengthOfEmployment': contact?.calculated_length_of_employment,
					'employmentInfo.occupationPosition': contact?.occupation_position,
					'employmentInfo.monthlyGrossIncome': contact?.monthly_gross_income,
					'employmentInfo.annualPersonalIncome': contact?.annual_personal_income,
					'employmentInfo.frontEndRtiRatio': contact?.front_end_dti_ratio,
					'employmentInfo.totalAnnualHouseholdIncome': contact?.total_annual_household_income,
					'employmentInfo.householdFrontEndDtiRatio': contact?.household_front_end_dti_ratio__cloned_,
					'employmentInfo.statedMonthlyIncome': contact?.stated_monthly_income,
					'employmentInfo.statedAnnualIncome': contact?.stated_annual_income,
					'employmentInfo.statedAnnualHouseholdIncome': contact?.stated_annual_household_income,

					// SECURITY QUESTIONS
					'securityQuestions.birthCity': contact?.birth_city,
					'securityQuestions.bronInForeignCountry': contact?.were_you_born_in_a_foreign_country_,
					'securityQuestions.legalPermanentResident': contact?.are_you_a_legal_permanent_resident_,
					'securityQuestions.greenCardExpirationDate': contact?.green_card_expiration_date,
					'securityQuestions.mothersMaidenName': contact?.mother_s_maiden_name,
					'securityQuestions.highSchoolMascot': contact?.high_school_mascot,
					'securityQuestions.highSchoolCity': contact?.high_school_city,
					'securityQuestions.nameOfStreetYouGrewUp': contact?.name_of_street_you_grew_up_on,
					'securityQuestions.favoritePetsName': contact?.favorite_pet_s_name,

					// EDUCATION
					'educationInfo.collegeAttended': contact?.college_university_attended,
					'educationInfo.fieldOfStudy': contact?.field_of_study,
					'educationInfo.degree': contact?.degree,
					'educationInfo.graduatedDate': contact?.graduation_date,
					'educationInfo.graduateSchoolAttended': contact?.graduate_school_attended,
					'educationInfo.graduateSchoolFieldOfStudy': contact?.graduate_school_field_of_study,
					'educationInfo.graduateDegreeReceived': contact?.graduate_degree_received,
					'educationInfo.graduateGraduationDate': contact?.graduate_graduation_date,

					// ASSET INFORMATION
					'assetInfo.combinedCheckingSavingsBalance': contact?.combined_checking_savings_balance,
					'assetInfo.stocksBondsMutualFunds': contact?.stocks_bonds_mutual_funds,
					'assetInfo.retirementAccountBalance': contact?.retirement_account_balance,

					// PRIMARY RESIDENCE VALUATION
					'primaryResidenceValuation.avmValue': contact?.avm_in_response_com,
					'primaryResidenceValuation.marketValue': contact?.market_value_in_response_com,
					'primaryResidenceValuation.zillowValue': contact?.zillow_value,
					'primaryResidenceValuation.estimatedPropertyValue': contact?.estimated_property_value,
					'primaryResidenceValuation.estimatedEquityPrimaryResidence': contact?.estimated_equity_in_primary_residence,
					'primaryResidenceValuation.calculatedValue': contact?.calculated_value,
					'primaryResidenceValuation.calculatedEquity': contact?.calculated_equity,

					submissionEmail: contact?.submission_email,
					submissionPassword: contact?.submission_password,
				},
				isNil
			);
			await Customer.findByIdAndUpdate(customer._id, updateContactProperties);

			res.json({
				message: 'Customer Updated!',
			});
		}
	} catch (err) {
		next(err);
	}
};

export const putSyncCreditEvaluationDeal: RequestHandler = async (req, res, next) => {
	try {
		const { dealId } = req.params;

		const creditEvaluation = await CreditEvaluation.findOne({ hubspotDealId: dealId });

		if (!creditEvaluation) {
			res.json({
				message: 'No Credit Evaluation Found!',
			});
		} else {
			let deal;
			let dealstage;
			if (dealId) {
				deal = await hsGetDealById(dealId);

				if (deal?.dealstage) {
					dealstage = await hsGetDealstageById(deal.dealstage);
				}
			}

			const affordability =
				//@ts-expect-error
				deal?.affordability ?? (hsAffordabilities[deal.affordability] as CreditEvaluationAffordabilityEnum);

			await CreditEvaluation.findByIdAndUpdate(creditEvaluation._id, {
				// Deal Related
				notes: deal?.underwriter_comments,
				affordability: affordability ?? creditEvaluation.affordability,
				dealStatus: dealstage?.label,
			});
		}

		res.json({
			message: 'Credit Evaluation Updated!',
		});
	} catch (err) {
		next(err);
	}
};
