import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import CreditEvaluation from 'models/creditEvaluation';
import { ICustomer } from 'models/customer';
import LoanApplication, { ILoanApplication } from 'models/loanApplication';
import { LeanDocument } from 'mongoose';
import { hsDeleteLoan, hsFetchLoan, hsGetLenderById } from './hubspot';

export const getLoanApplications: RequestHandler = async (req, res, next) => {
	try {
		const { data: loanApplicationsRaw, count } = await queryFilter({
			Model: LoanApplication,
			query: req.query,
			// populate: 'customer',
			// searchFields: ['firstName', 'lastName', 'middleName'],
		});

		const loanApplications: LeanDocument<ILoanApplication>[] = [];

		// Check if up to date
		for await (let loanApplication of loanApplicationsRaw) {
			if (loanApplication.hubspotId && loanApplication.upToDate) {
				const hsLoan = await hsFetchLoan(loanApplication.hubspotId);

				if (hsLoan) {
					loanApplication = await LoanApplication.findByIdAndUpdate(
						loanApplication._id,
						{
							name: hsLoan.loan_name,
							loanAmount: hsLoan.amount,
							monthlyPayment: hsLoan.monthly_payment,
							term: hsLoan.term___months,
							interestRate: hsLoan.interest_rate,
							originationFee: hsLoan.origination_fee,
							totalOriginationFee: hsLoan.origination_fee_total,
							apr: hsLoan.loan_apr,
						},
						{ new: true }
					).lean();
				} else {
					loanApplication = await LoanApplication.findByIdAndUpdate(
						loanApplication._id,
						{
							hubspotId: null,
							upToDate: false,
						},
						{ new: true }
					).lean();
				}
			}

			loanApplications.push(loanApplication);
		}

		res.json({
			data: loanApplications,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const postLoanApplication: RequestHandler = async (req, res, next) => {
	try {
		const {
			creditEvaluation: creditEvaluationId,

			lenderId,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			totalOriginationFee,
			reasonCode,
		} = req.body;

		const lender = await hsGetLenderById(lenderId);

		const creditEvaluation = await CreditEvaluation.findById(creditEvaluationId)
			.select('customer')
			.populate('customer');

		const customer = creditEvaluation?.customer as unknown as LeanDocument<ICustomer>;
		await LoanApplication.create({
			customer: customer._id,
			creditEvaluation: creditEvaluationId,

			name: `${lender?.lender_name} | ${customer.firstName} ${customer.lastName} | ${customer.leadSource ?? 'None'}`,
			lenderId,
			lender: lender?.lender_name,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			totalOriginationFee,
			reasonCode,
		});

		res.json({
			// message: i18n.__('CONTROLLER.LOAN_APPLICATION.POST_LOAN_APPLICATION.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putLoanApplication: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const {
			lenderId,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			totalOriginationFee,
			reasonCode,
		} = req.body;

		const loanApplication = await LoanApplication.findById(id);

		const lender = await hsGetLenderById(lenderId);
		const creditEvaluation = await CreditEvaluation.findById(loanApplication?.creditEvaluation)
			.select('customer')
			.populate('customer');

		const customer = creditEvaluation?.customer as unknown as LeanDocument<ICustomer>;
		await LoanApplication.findByIdAndUpdate(id, {
			name: `${lender?.lender_name} | ${customer.firstName} ${customer.lastName} | ${customer.leadSource ?? 'None'}`,
			lenderId,
			lender: lender?.lender_name,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			totalOriginationFee,
			reasonCode,
			upToDate: false,
		});

		res.json({
			// message: i18n.__('CONTROLLER.LOAN_APPLICATION.PUT_LOAN_APPLICATION.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putLoanApplicationStatus: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		await LoanApplication.findByIdAndUpdate(id, {
			status,
			upToDate: false,
		});

		res.json({
			// message: i18n.__('CONTROLLER.LOAN_APPLICATION.PUT_LOAN_APPLICATION.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteLoanApplication: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const loanApplication = await LoanApplication.findById(id);

		// Delete from hubspot
		if (loanApplication?.hubspotId) {
			await hsDeleteLoan(loanApplication.hubspotId);
		}

		await LoanApplication.findByIdAndDelete(id);

		res.json({
			// message: i18n.__('CONTROLLER.LOAN_APPLICATION.DELETE_LOAN_APPLICATION.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleLoanApplication: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const loanApplication = await LoanApplication.findById(id);

		res.json({
			data: loanApplication,
		});
	} catch (err) {
		next(err);
	}
};
