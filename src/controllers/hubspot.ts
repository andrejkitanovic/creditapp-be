import { Client } from '@hubspot/api-client';
import { SimplePublicObject } from '@hubspot/api-client/lib/codegen/crm/companies';
import {
	Filter as ContactFilter,
	FilterGroup as ContactFilterGroup,
} from '@hubspot/api-client/lib/codegen/crm/contacts';
import { RequestHandler } from 'express';
import { ICustomer } from 'models/customer';
import LoanPackage from 'models/loanPackage';
import {
	ILoanApplication,
	LoanApplicationAccountType,
	LoanApplicationCreditInquiry,
	LoanApplicationStatus,
} from 'models/loanApplication';
import { LeanDocument } from 'mongoose';
import { filterObject } from 'utils/filterObject';
import dayjs from 'dayjs';
import { Property } from '@hubspot/api-client/lib/codegen/crm/properties';
import { IOrganisation } from 'models/organisation';
import { PipelineStage } from '@hubspot/api-client/lib/codegen/crm/pipelines';

export const hubspotClient = new Client({ accessToken: process.env.HS_ACCESS_TOKEN });

// Routes
export const getHubspotLenders: RequestHandler = async (req, res, next) => {
	try {
		const { results: hsLenders } = await hubspotClient.crm.objects.basicApi.getPage('2-11419675', 100, undefined, [
			'lender_name',
			'origination_fee',
			'credit_bureau',
		]);
		const lenders =
			hsLenders?.map((lender) => ({
				id: lender.id,
				...lender.properties,
			})) ?? [];

		res.json({
			data: lenders,
		});
	} catch (err) {
		next(err);
	}
};

// USERS
export const hsGetUserById = async (userId: string): Promise<{ [key: string]: string | undefined }> => {
	try {
		const { id, email, roleId, primaryTeamId } = await hubspotClient.settings.users.usersApi.getById(userId);

		return { id, email, roleId, primaryTeamId };
	} catch (err) {
		console.log(err);

		return {};
	}
};

export const hsGetUserByEmail = async (email: string) => {
	try {
		const res = await hubspotClient.apiRequest({
			path: `/settings/v3/users/${email}`,
			qs: {
				idProperty: 'EMAIL',
			},
		});
		const data = await res.json();

		return data;
	} catch (err) {
		console.log(err);

		return {};
	}
};

export const hsCreateUser = async ({ email: userEmail, role }: { email: string; role: 'admin' | 'partner' }) => {
	try {
		const roleProperties = {
			admin: {
				// roleId: "",
				primaryTeamId: '32518302',
			},
			partner: {
				roleId: '611058',
				primaryTeamId: '32467381',
			},
		};

		const { id, email, roleId, primaryTeamId } = await hubspotClient.settings.users.usersApi.create({
			email: userEmail,
			sendWelcomeEmail: true,
			...roleProperties[role],
		});

		return {
			id,
			email,
			roleId,
			primaryTeamId,
		};
	} catch (err) {
		console.log(err);
		return;
	}
};

// LEAD SOURCE
export const hsCreateLeadSource = async (leadSource: string) => {
	try {
		const { properties: contactSchema } = await hubspotClient.crm.schemas.coreApi.getById('contact');
		const { properties: dealSchema } = await hubspotClient.crm.schemas.coreApi.getById('deals');
		const { properties: loanSchema } = await hubspotClient.crm.schemas.coreApi.getById('loans');
		const { properties: leaseSchema } = await hubspotClient.crm.schemas.coreApi.getById('leases');

		const contactSchemaLeadSource = contactSchema.find((property) => property.name === 'lead_source') as Property;
		const dealSchemaLeadSource = dealSchema.find(
			(property) => property.name === 'lead_source___companies___li_and_fb'
		) as Property;
		const loanSchemaLeadSource = loanSchema.find((property) => property.name === 'lead_source') as Property;
		const leaseSchemaLeadSource = leaseSchema.find((property) => property.name === 'lead_source') as Property;

		if (
			contactSchemaLeadSource.options.some((option) => option.value === leadSource) ||
			dealSchemaLeadSource.options.some((option) => option.value === leadSource) ||
			loanSchemaLeadSource.options.some((option) => option.value === leadSource) ||
			leaseSchemaLeadSource.options.some((option) => option.value === leadSource)
		) {
			return false;
		}

		// UPDATE CONTACT PROPERTY
		await (
			await hubspotClient.apiRequest({
				path: `/properties/v1/contacts/properties/named/lead_source`,
				method: 'PUT',
				body: {
					name: contactSchemaLeadSource.name,
					groupName: contactSchemaLeadSource.groupName,
					description: contactSchemaLeadSource.description,
					fieldType: contactSchemaLeadSource.fieldType,
					formField: contactSchemaLeadSource.formField,
					type: contactSchemaLeadSource.type,
					displayOrder: contactSchemaLeadSource.displayOrder,
					label: contactSchemaLeadSource.label,
					options: [
						...contactSchemaLeadSource.options,
						{
							label: leadSource,
							value: leadSource,
							hidden: false,
						},
					],
				},
			})
		).json();

		// UPDATE DEAL PROPERTY
		await (
			await hubspotClient.apiRequest({
				path: `/properties/v1/deals/properties/named/lead_source___companies___li_and_fb`,
				method: 'PUT',
				body: {
					name: dealSchemaLeadSource.name,
					groupName: dealSchemaLeadSource.groupName,
					description: dealSchemaLeadSource.description,
					fieldType: dealSchemaLeadSource.fieldType,
					formField: dealSchemaLeadSource.formField,
					type: dealSchemaLeadSource.type,
					displayOrder: dealSchemaLeadSource.displayOrder,
					label: dealSchemaLeadSource.label,
					options: [
						...dealSchemaLeadSource.options,
						{
							label: leadSource,
							value: leadSource,
							hidden: false,
						},
					],
				},
			})
		).json();

		// UPDATE LOAN PROPERTY
		await (
			await hubspotClient.apiRequest({
				path: `/properties/v2/loans/properties/named/lead_source`,
				method: 'PUT',
				body: {
					name: loanSchemaLeadSource.name,
					groupName: loanSchemaLeadSource.groupName,
					description: loanSchemaLeadSource.description,
					fieldType: loanSchemaLeadSource.fieldType,
					formField: loanSchemaLeadSource.formField,
					type: loanSchemaLeadSource.type,
					displayOrder: loanSchemaLeadSource.displayOrder,
					label: loanSchemaLeadSource.label,
					options: [
						...loanSchemaLeadSource.options,
						{
							label: leadSource,
							value: leadSource,
							hidden: false,
						},
					],
				},
			})
		).json();

		// UPDATE LEASE PROPERTY
		await (
			await hubspotClient.apiRequest({
				path: `/properties/v2/leases/properties/named/lead_source`,
				method: 'PUT',
				body: {
					name: leaseSchemaLeadSource.name,
					groupName: leaseSchemaLeadSource.groupName,
					description: leaseSchemaLeadSource.description,
					fieldType: leaseSchemaLeadSource.fieldType,
					formField: leaseSchemaLeadSource.formField,
					type: leaseSchemaLeadSource.type,
					displayOrder: leaseSchemaLeadSource.displayOrder,
					label: leaseSchemaLeadSource.label,
					options: [
						...leaseSchemaLeadSource.options,
						{
							label: leadSource,
							value: leadSource,
							hidden: false,
						},
					],
				},
			})
		).json();

		return true;
	} catch (err) {
		console.log(err);
		return;
	}
};

// PARTNERS TABLE
const PARTNERT_TABLE_ID = '6054171';
export const hsUpdatePartnerTable = async (organisation: LeanDocument<IOrganisation>) => {
	try {
		await hubspotClient.cms.hubdb.tablesApi.unpublishTable(PARTNERT_TABLE_ID);

		await hubspotClient.cms.hubdb.rowsApi.createTableRow(PARTNERT_TABLE_ID, {
			values: {
				partner_name: organisation.name,
				team_name: '',
				lead_source: organisation.leadSource,
				brand: organisation.brand,
				referral_partner_payout: organisation.partnerPayout?.value ? `${organisation.partnerPayout?.value}` : undefined,
			},
		});

		await hubspotClient.cms.hubdb.tablesApi.publishDraftTable(PARTNERT_TABLE_ID);
	} catch (err) {
		console.log(err);
		return false;
	}
};

// CONTACTS
export const hsGetContactById = async (contactId: string): Promise<{ [key: string]: string }> => {
	try {
		const { properties } = await hubspotClient.crm.contacts.basicApi.getById(contactId, [
			// GENERAL INFORMATION
			'firstname',
			'middle_name_or_initial',
			'lastname',
			'salutation',
			'email',
			'date_of_birth',
			'address',
			'city',
			'state',
			'zip',
			'phone',
			'mobilephone',
			'franchise_choice',

			// PERSONAL INFORMATION
			'driver_s_license_number',
			'dl_issuance_date',
			'dl_expiration_date',
			'member_of_credit_union',
			// 'leadin_current_bank_relationship_a336c6175472fb581f1e7ca0877fd813', // archived
			'personal_banking_relationship',
			'current_military_affiliation',
			'routing_number',
			'account_number',
			'have_you_been_through_credit_repair_',
			'judgements_liens_bankruptcy_',
			'have_you_worked_with_a_finance_company_like_ours_before_',
			'fraud_alert',
			'number_on_fraud_alert_if_it_is_not_cell_phone_or_home_phone',

			// HOUSING INFO
			'housing_status',
			'monthly_housing_payment',
			'estimated_length_of_time_at_residence',
			'move_in_date',
			'calculated_length_of_time_at_residence',
			'years_at_current_address',

			// EMPLOYMENT INFO
			'income_type',
			'employer',
			'employer_phone_number',
			'employer_address',
			'estimated_time_at_job',
			'start_date_with_employer',
			'calculated_length_of_employment',
			'occupation_position',
			'monthly_gross_income',
			'annual_personal_income',
			'front_end_dti_ratio',
			'total_annual_household_income',
			'household_front_end_dti_ratio__cloned_',
			'stated_monthly_income',
			'stated_annual_income',
			'stated_annual_household_income',

			// SECURITY QUESTIONS
			'birth_city',
			'were_you_born_in_a_foreign_country_',
			'are_you_a_legal_permanent_resident_',
			'green_card_expiration_date',
			'mother_s_maiden_name',
			'high_school_mascot',
			'high_school_city',
			'name_of_street_you_grew_up_on',
			'favorite_pet_s_name',

			// EDUCATION
			'college_university_attended',
			'field_of_study',
			'degree',
			'graduation_date',
			'graduate_school_attended',
			'graduate_school_field_of_study',
			'graduate_degree_received',
			'graduate_graduation_date',

			// ASSET INFORMATION
			'combined_checking_savings_balance',
			'stocks_bonds_mutual_funds',
			'retirement_account_balance',

			// PRIMARY RESIDENCE VALUATION
			'avm_in_response_com',
			'market_value_in_response_com',
			'zillow_value',
			'estimated_property_value',
			'calculated_value',
			'calculated_equity',

			// SUBMISSION
			'submission_email',
			'submission_password',
		]);

		return {
			id: contactId,
			...properties,
		};
	} catch (err) {
		console.log(err);

		return {};
	}
};

export const hsGetSingleContact = async (property: string, value: string) => {
	try {
		const filter: ContactFilter = { propertyName: property, operator: 'EQ', value };
		const filterGroup: ContactFilterGroup = { filters: [filter] };

		const searchFilter = {
			filterGroups: [filterGroup],
			properties: [
				// GENERAL INFORMATION
				'firstname',
				'middle_name_or_initial',
				'lastname',
				'salutation',
				'email',
				'date_of_birth',
				'address',
				'city',
				'state',
				'zip',
				'phone',
				'mobilephone',
				'franchise_choice',

				// PERSONAL INFORMATION
				'driver_s_license_number',
				'dl_issuance_date',
				'dl_expiration_date',
				'member_of_credit_union',
				// 'leadin_current_bank_relationship_a336c6175472fb581f1e7ca0877fd813', // archived
				'personal_banking_relationship',
				'current_military_affiliation',
				'routing_number',
				'account_number',
				'have_you_been_through_credit_repair_',
				'judgements_liens_bankruptcy_',
				'have_you_worked_with_a_finance_company_like_ours_before_',
				'fraud_alert',
				'number_on_fraud_alert_if_it_is_not_cell_phone_or_home_phone',

				// HOUSING INFO
				'housing_status',
				'monthly_housing_payment',
				'estimated_length_of_time_at_residence',
				'move_in_date',
				'calculated_length_of_time_at_residence',
				'years_at_current_address',

				// EMPLOYMENT INFO
				'income_type',
				'employer',
				'employer_phone_number',
				'employer_address',
				'estimated_time_at_job',
				'start_date_with_employer',
				'calculated_length_of_employment',
				'occupation_position',
				'monthly_gross_income',
				'annual_personal_income',
				'front_end_dti_ratio',
				'total_annual_household_income',
				'household_front_end_dti_ratio__cloned_',
				'stated_monthly_income',
				'stated_annual_income',
				'stated_annual_household_income',

				// SECURITY QUESTIONS
				'birth_city',
				'were_you_born_in_a_foreign_country_',
				'are_you_a_legal_permanent_resident_',
				'green_card_expiration_date',
				'mother_s_maiden_name',
				'high_school_mascot',
				'high_school_city',
				'name_of_street_you_grew_up_on',
				'favorite_pet_s_name',

				// EDUCATION
				'college_university_attended',
				'field_of_study',
				'degree',
				'graduation_date',
				'graduate_school_attended',
				'graduate_school_field_of_study',
				'graduate_degree_received',
				'graduate_graduation_date',

				// ASSET INFORMATION
				'combined_checking_savings_balance',
				'stocks_bonds_mutual_funds',
				'retirement_account_balance',

				// PRIMARY RESIDENCE VALUATION
				'avm_in_response_com',
				'market_value_in_response_com',
				'zillow_value',
				'estimated_property_value',
				'calculated_value',
				'calculated_equity',

				// SUBMISSION
				'submission_email',
				'submission_password',
			],
			limit: 1,
			sorts: ['id'],
			after: 0,
		};
		return await hubspotClient.crm.contacts.searchApi.doSearch(searchFilter);
	} catch (err) {
		console.log(err);

		return {
			results: [],
			total: 0,
		};
	}
};

export const hsCreateContact = async (customer: any): Promise<Record<string, never> | SimplePublicObject> => {
	try {
		return await hubspotClient.crm.contacts.basicApi.create({
			properties: {
				email: customer.email,
				firstname: customer.firstName,
				lastname: customer.lastName,
				phone: customer.phone,
			},
		});
	} catch (err) {
		console.log(err);

		return {};
	}
};

export const hsUpdateContact = async (
	contactId: string,
	customer: LeanDocument<ICustomer>
): Promise<Record<string, never> | SimplePublicObject> => {
	try {
		return await hubspotClient.crm.contacts.basicApi.update(contactId, {
			properties: filterObject({
				// GENERAL INFORMATION
				firstname: customer.firstName,
				middle_name_or_initial: customer.middleName,
				lastname: customer.lastName,
				salutation: customer.salutation,
				email: customer.email,
				// 'date_of_birth',
				address: customer.address,
				city: customer.city,
				state: customer.state,
				zip: customer.zip,
				phone: customer.phone,
				mobilephone: customer.mobilePhone,
				referral_company: customer.referralSource,
				franchise_choice: customer.franchiseChoice,

				// PERSONAL INFORMATION
				driver_s_license_number: customer.personalInfo.driversLicenseId,
				// dl_issuance_date: customer.personalInfo.driversLicenseIssueDate,
				// dl_expiration_date: customer.personalInfo.driversLicenseExpireDate,
				member_of_credit_union: customer.personalInfo.creditUnion,
				personal_banking_relationship: customer.personalInfo.personalBank,
				current_military_affiliation: customer.personalInfo.militaryStatus,
				routing_number: customer.personalInfo.bankRoutingNumber,
				account_number: customer.personalInfo.bankAccountNumber,
				have_you_been_through_credit_repair_: customer.personalInfo.creditRepairBefore,
				judgements_liens_bankruptcy_: customer.personalInfo.judgementsLiensBankruptcy,
				have_you_worked_with_a_finance_company_like_ours_before_: customer.personalInfo.previoiusFinanceCompany,
				marital_status: customer.personalInfo.maritalStatus,
				fraud_alert:
					typeof customer.personalInfo.fraudAlert === 'boolean' && Boolean(customer.personalInfo.fraudAlert)
						? 'true'
						: 'false',
				number_on_fraud_alert_if_it_is_not_cell_phone_or_home_phone: customer.personalInfo.numberOfFraudAlert,

				// HOUSING INFO
				housing_status: customer.housingInfo.houstingStatus,
				monthly_housing_payment: customer.housingInfo.monthlyHousingPayment,
				estimated_length_of_time_at_residence: customer.housingInfo.estimatedLengthOfTimeAtResidence,
				// move_in_date: customer.housingInfo.moveInDate,
				calculated_length_of_time_at_residence: customer.housingInfo.calculatedLengthOfTimeAtResidence,
				years_at_current_address: customer.housingInfo.yearsAtCurrentAddress,

				// EMPLOYMENT INFO
				income_type: customer.employmentInfo.incomeType,
				employer: customer.employmentInfo.employerName,
				employer_phone_number: customer.employmentInfo.employerPhone,
				employer_address: customer.employmentInfo.employerAddress,
				estimated_time_at_job: customer.employmentInfo.estimatedTimeAtJob,
				start_date_with_employer: customer.employmentInfo.startDateWithEmployer,
				calculated_length_of_employment: customer.employmentInfo.calculatedLengthOfEmployment,
				occupation_position: customer.employmentInfo.occupationPosition,
				monthly_gross_income: customer.employmentInfo.monthlyGrossIncome,
				// annual_personal_income: customer.employmentInfo.annualPersonalIncome, - CALCULATED PROPERTY
				front_end_dti_ratio: customer.employmentInfo.frontEndRtiRatio,
				total_annual_household_income: customer.employmentInfo.totalAnnualHouseholdIncome,
				household_front_end_dti_ratio__cloned_: customer.employmentInfo.householdFrontEndDtiRatio,
				stated_monthly_income: customer.employmentInfo.statedMonthlyIncome,
				stated_annual_income: customer.employmentInfo.statedAnnualIncome,
				stated_annual_household_income: customer.employmentInfo.statedAnnualHouseholdIncome,

				// SECURITY QUESTIONS
				birth_city: customer.securityQuestions.birthCity,
				were_you_born_in_a_foreign_country_: customer.securityQuestions.bronInForeignCountry,
				are_you_a_legal_permanent_resident_: customer.securityQuestions.legalPermanentResident,
				green_card_expiration_date: customer.securityQuestions.greenCardExpirationDate,
				mother_s_maiden_name: customer.securityQuestions.mothersMaidenName,
				high_school_mascot: customer.securityQuestions.highSchoolMascot,
				high_school_city: customer.securityQuestions.highSchoolCity,
				name_of_street_you_grew_up_on: customer.securityQuestions.nameOfStreetYouGrewUp,
				favorite_pet_s_name: customer.securityQuestions.favoritePetsName,

				// EDUCATION
				college_university_attended: customer.educationInfo.collegeAttended,
				field_of_study: customer.educationInfo.fieldOfStudy,
				degree: customer.educationInfo.degree,
				graduation_date:
					customer.educationInfo.graduatedDate && dayjs(customer.educationInfo.graduatedDate).format('YYYY'),
				graduate_school_attended: customer.educationInfo.graduateSchoolAttended,
				graduate_school_field_of_study: customer.educationInfo.graduateSchoolFieldOfStudy,
				graduate_degree_received: customer.educationInfo.graduateDegreeReceived,
				graduate_graduation_date: customer.educationInfo.graduateGraduationDate,

				// ASSET INFORMATION
				combined_checking_savings_balance: customer.assetInfo.combinedCheckingSavingsBalance,
				stocks_bonds_mutual_funds: customer.assetInfo.stocksBondsMutualFunds,
				retirement_account_balance: customer.assetInfo.retirementAccountBalance,

				// PRIMARY RESIDENCE VALUATION
				avm_in_response_com: customer.primaryResidenceValuation.avmValue,
				market_value_in_response_com: customer.primaryResidenceValuation.marketValue,
				zillow_value: customer.primaryResidenceValuation.zillowValue,
				estimated_property_value: customer.primaryResidenceValuation.estimatedPropertyValue,
				estimated_equity_in_primary_residence: customer.primaryResidenceValuation.estimatedEquityPrimaryResidence,
				calculated_value: customer.primaryResidenceValuation.calculatedValue,
				calculated_equity: customer.primaryResidenceValuation.calculatedEquity,

				submission_email: customer.submissionEmail,
				submission_password: customer.submissionPassword,
			}),
		});
	} catch (err) {
		console.log(err);

		return {};
	}
};

// DEALS
export const hsGetDealById = async (dealId: string): Promise<{ [key: string]: string }> => {
	try {
		const { properties } = await hubspotClient.crm.deals.basicApi.getById(dealId, [
			'dealname',
			'dealstage',
			'amount',
			'monthly_payment',
			'term_months',
			'interest_rate',
			'origination_fee',
			'underwriter_comments',
			'affordability',
		]);

		return {
			id: dealId,
			...properties,
		};
	} catch (err) {
		console.log(err);

		return {};
	}
};

export const hsGetDealstageById = async (dealstageId: string): Promise<PipelineStage | undefined> => {
	try {
		const { results: dealnamePipelines } = await hubspotClient.crm.pipelines.pipelinesApi.getAll('deals');
		const dealnameStages = dealnamePipelines.flatMap((dealnamePipeline) => dealnamePipeline.stages);

		return dealnameStages.find((dealnameStage: PipelineStage) => dealnameStage.id === dealstageId);
	} catch (err) {
		console.log(err);
		return;
	}
};

// LENDERS
export const hsGetLenderById = async (lenderId: string): Promise<{ [key: string]: string }> => {
	try {
		const { properties } = await hubspotClient.crm.objects.basicApi.getById('2-11419675', lenderId, [
			'lender_name',
			'credit_bureau',
		]);

		return {
			id: lenderId,
			...properties,
		};
	} catch (err) {
		console.log(err);

		return {};
	}
};

// LOANS

export const hsGetLoanById = async (loanId: string): Promise<any> => {
	try {
		const { properties } = await hubspotClient.crm.objects.basicApi.getById('2-11419916', loanId, [
			'loan_name',
			'amount',
			'monthly_payment',
			'term___months',
			'interest_rate',
			'origination_fee_amount',
			'origination_fee_percentage',
			'loan_apr',
			'loan_status',
			'account_type',
			'credit_inquiry',
		]);

		return {
			id: loanId,
			...properties,
		};
	} catch (err) {
		console.log(err);

		return null;
	}
};

export const LoanStatus = {
	[LoanApplicationStatus.APPLICATION_PENDING_SUBMISSION]: 'Application Pending Submission',
	[LoanApplicationStatus.APPLICATION_SUBMITTED]: 'Application Submitted',
	[LoanApplicationStatus.APPLICATION_DOCUMENTS_REQUIRED]: 'Additional Documents Required',
	[LoanApplicationStatus.LOAN_APPROVED]: 'Loan Approved',
	[LoanApplicationStatus.LOAN_FUNDED]: 'Loan Funded',
	// [LoanApplicationStatus]: "No Charge",
	// [LoanApplicationStatus]: "Invoiced",
	// [LoanApplicationStatus]: "Paid Invoice",
	[LoanApplicationStatus.APPROVED_NOT_TAKEN]: 'Approved - Not Taken',
	[LoanApplicationStatus.LOAN_DECLINED]: 'Loan Declined',
	[LoanApplicationStatus.CANCEL_PROCESS]: 'Cancel Process',
};

export const LoanAccountType = {
	[LoanApplicationAccountType.UNSECURED_LOAN_INDIVIDUAL]: 'Unsecured Loan - Individual',
	[LoanApplicationAccountType.UNSECURED_LOAN_JOINT]: 'Unsecured Loan - Joint',
	[LoanApplicationAccountType.BUSINESS_LOAN_PERSONALLY_GUARANTEED]: 'Business Loan - Personally Guaranteed',
};

export const LoanCreditInquiry = {
	[LoanApplicationCreditInquiry.EXPERIAN]: 'Experian',
	[LoanApplicationCreditInquiry.TRANSUNION]: 'Trans Union',
	[LoanApplicationCreditInquiry.EQUIFAX]: 'Equifax',
	[LoanApplicationCreditInquiry.TRI_MERGE]: 'Tri-Merge',
	[LoanApplicationCreditInquiry.SOFT_PULL]: 'Soft-Pull',
};

export const hsCreateLoan = async (loanApplication: LeanDocument<ILoanApplication>) => {
	try {
		const { id: loanId } = await hubspotClient.crm.objects.basicApi.create('2-11419916', {
			properties: {
				loan_name: loanApplication.name,
				amount: loanApplication.loanAmount?.toString(),
				monthly_payment: loanApplication.monthlyPayment?.toString(),
				term___months: loanApplication.term?.toString(),
				credit_inquiry: loanApplication.creditInquiry
					?.map((creditInquiry) => {
						return LoanCreditInquiry[creditInquiry];
					})
					.join(';'),
				application_date: dayjs(loanApplication.applicationDate)
					.add(1, 'day')
					.startOf('day')
					.toDate()
					.getTime()
					.toString(),
				loan_status: LoanStatus[loanApplication.status] ?? '',
				lead_source: loanApplication.leadSource,
				//@ts-expect-error
				account_type: LoanAccountType[loanApplication.accountType] ?? '',
				interest_rate: loanApplication.interestRate?.toString(),
				loan_purpose: loanApplication.reasonCode?.toString(),
				loan_apr: loanApplication.apr?.toString(),
				origination_fee_amount: loanApplication.originationFee?.toString(),

				// loan_stage: loanApplication.status,
				// : loanApplication.loanWeightFactor?.toString(),
				// origination_fee: loanApplication.originationFee?.toString(),
				// : loanApplication.reasonCode?.toString(),
			},
		});

		// Get Lender
		const { id: lenderId } = await hubspotClient.crm.objects.basicApi.getById('2-11419675', loanApplication.lenderId);
		if (lenderId) {
			// Associate lender
			await hubspotClient.crm.objects.associationsApi.create('2-11419916', loanId, '2-11419675', lenderId, 'lender');
		}

		const loanPackage = await LoanPackage.findOne({ creditEvaluation: loanApplication.creditEvaluation });
		if (loanPackage) {
			// Get Deal
			const { id: dealId } = await hubspotClient.crm.deals.basicApi.getById(loanPackage.hubspotId ?? '');

			if (dealId) {
				// Associate deal
				await hubspotClient.crm.objects.associationsApi.create(
					'2-11419916',
					loanId,
					'deal',
					dealId,
					'loan_application'
				);
			}
		}

		return loanId;
	} catch (err) {
		console.log(err);

		return null;
	}
};

export const hsUpdateLoan = async (loanApplication: LeanDocument<ILoanApplication>) => {
	try {
		const { id } = await hubspotClient.crm.objects.basicApi.update('2-11419916', loanApplication.hubspotId ?? '', {
			properties: {
				loan_name: loanApplication.name,
				amount: loanApplication.loanAmount?.toString(),
				monthly_payment: loanApplication.monthlyPayment?.toString(),
				term___months: loanApplication.term?.toString(),
				credit_inquiry: loanApplication.creditInquiry
					?.map((creditInquiry) => {
						return LoanCreditInquiry[creditInquiry];
					})
					.join(';'),
				application_date: dayjs(loanApplication.applicationDate)
					.add(1, 'day')
					.startOf('day')
					.toDate()
					.getTime()
					.toString(),
				lead_source: loanApplication.leadSource,
				loan_status: LoanStatus[loanApplication.status] ?? '',
				//@ts-expect-error
				account_type: LoanAccountType[loanApplication.accountType] ?? '',
				interest_rate: loanApplication.interestRate?.toString(),
				loan_purpose: loanApplication.reasonCode?.toString(),
				loan_apr: loanApplication.apr?.toString(),
				origination_fee_amount: loanApplication.originationFee?.toString(),
			},
		});

		return id;
	} catch (err) {
		console.log(err);

		return null;
	}
};

export const hsDeleteLoan = async (loanApplicationId: string) => {
	try {
		await hubspotClient.crm.objects.basicApi.archive('2-11419916', loanApplicationId);
	} catch (err) {
		console.log(err);
	}
};
