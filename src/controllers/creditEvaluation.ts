import dayjs from 'dayjs';
import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import CreditEvaluation from 'models/creditEvaluation';
import { cbcFormatDate } from './cbc';

export const getCreditEvaluations: RequestHandler = async (req, res, next) => {
	try {
		const { data: creditEvaluations, count } = await queryFilter({
			Model: CreditEvaluation,
			query: req.query,
			populate: 'customer',
			// searchFields: ['firstName', 'lastName', 'middleName'],
		});

		res.json({
			data: creditEvaluations,
			meta: createMeta({ count }),
		});
	} catch (err) {
		next(err);
	}
};

export const postCreditEvaluation: RequestHandler = async (req, res, next) => {
	try {
		const { customer } = req.body;

		await CreditEvaluation.create({
			customer,
		});

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.POST_PARTNER.ADDED'),
		});
	} catch (err) {
		next(err);
	}
};

export const putCreditEvaluation: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { customer } = req.body;

		await CreditEvaluation.findByIdAndUpdate(id, { customer });

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.PUT_PARTNER.UPDATED'),
		});
	} catch (err) {
		next(err);
	}
};

export const deleteCreditEvaluation: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		await CreditEvaluation.findByIdAndDelete(id);

		res.json({
			// message: i18n.__('CONTROLLER.PARTNER.DELETE_PARTNER.DELETED'),
		});
	} catch (err) {
		next(err);
	}
};

export const getSingleCreditEvaluation: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;

		const creditEvaluation = await CreditEvaluation.findById(id);

		res.json({
			data: creditEvaluation,
		});
	} catch (err) {
		next(err);
	}
};

export const cbcReportToCreditEvaluation = (reportData: any) => {
	let totalOpenTradelines = 0;
	let totalMonthsOfOpenRevolvingCredits = 0;
	let ageOfFile: Date | null = null;
	let firstCreditAccount: string | null = null;

	const tradelines = reportData.CC_ATTRIB.CCTRADELINES.ITEM_TRADELINE.map((tradelineData: any) => {
		if (!ageOfFile || dayjs(cbcFormatDate(tradelineData.DATEOPENED)).diff(dayjs(ageOfFile)) < 0) {
			ageOfFile = cbcFormatDate(tradelineData.DATEOPENED);
			firstCreditAccount = tradelineData.FIRMNAME_ID;
		}

		if (
			tradelineData.OPENIND === 'O' &&
			cbcFormatDate(tradelineData.DATEOPENED) &&
			tradelineData.CREDITLIMIT !== '-1'
		) {
			totalOpenTradelines += 1;
			totalMonthsOfOpenRevolvingCredits += dayjs().diff(dayjs(cbcFormatDate(tradelineData.DATEOPENED)), 'month');
		}

		return {
			creditor: tradelineData.FIRMNAME_ID,
			balance: parseFloat(tradelineData.BALANCEPAYMENT) ?? undefined,
			payment: parseFloat(tradelineData.MONTHLYPAYMENT) ?? undefined,
			creditLimit: parseFloat(tradelineData.CREDITLIMIT) ?? undefined,
			opened: cbcFormatDate(tradelineData.DATEOPENED),
			reportDate: cbcFormatDate(tradelineData.DATEREPORTED),
			accountType: tradelineData.OWNERSHIP.DESCRIPTION,
			utilizationRate: tradelineData.BALANCEPAYMENT / tradelineData.CREDITLIMIT,
		};
	});

	const lastTwelveMonths = reportData.CC_ATTRIB.CCINQUIRIES.ITEM_INQUIRY.filter((inquiryItem: { DATE: string }) => {
		return dayjs().diff(dayjs(cbcFormatDate(inquiryItem.DATE)), 'year', true) <= 1;
	});
	const recentInquiries = [
		{
			type: 'XPN',
			lastSixMonths: parseInt(reportData.CC_ATTRIB.CCSUMMARY.LAST_6MINQUIRIES) ?? 0,
			lastTwelveMonths: lastTwelveMonths.length ?? 0,
		},
	];

	const averageMonthsOfOpenRevolvingCredit = totalMonthsOfOpenRevolvingCredits / totalOpenTradelines;

	return {
		// reportDate: cbcFormatDate(),
		firstCreditAccount,
		monitoringService: 'CBC',
		// state: "",
		ageOfFile,
		averageMonthsOfOpenRevolvingCredit,
		// loanPackageAmount: 0,
		creditScores: [
			{
				type: 'XPN',
				score: parseInt(reportData.SCORES.SCORE) ?? 0,
			},
		],
		recentInquiries,
		tradelines,
		// businessTradelines: [{}].
		// loans: [{}],
		// debtDetails: {};
		// income: {};
		// loanAffordabilityCalculator: {};
	};
};
