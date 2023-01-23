import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import CreditEvaluation from 'models/creditEvaluation';
import LoanApplication from 'models/loanApplication';

export const getLoanApplications: RequestHandler = async (req, res, next) => {
	try {
		const { data: loanApplications, count } = await queryFilter({
			Model: LoanApplication,
			query: req.query,
			// populate: 'customer',
			// searchFields: ['firstName', 'lastName', 'middleName'],
		});

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

			lender,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			originationFee,
			reasonCode,
		} = req.body;

		const creditEvaluation = await CreditEvaluation.findById(creditEvaluationId).select('customer');

		await LoanApplication.create({
			customer: creditEvaluation?.customer,
			creditEvaluation: creditEvaluationId,

			lender,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			originationFee,
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
			lender,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			originationFee,
			reasonCode,
		} = req.body;

		await LoanApplication.findByIdAndUpdate(id, {
			lender,
			loanAmount,
			monthlyPayment,
			term,
			creditInquiry,
			applicationDate,
			status,
			accountType,
			interestRate,
			originationFee,
			reasonCode,
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
			$set: { upToDate: false },
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
