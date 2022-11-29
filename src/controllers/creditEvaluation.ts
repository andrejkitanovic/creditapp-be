import dayjs from 'dayjs';
import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import CreditEvaluation from 'models/creditEvaluation';

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

export const cbcReportToCreditEvaluation = async (customerId: string, reportData: any, reportLink: string) => {
	const tradelines = reportData.CC_ATTRIB.CCTRADELINES.ITEM_TRADELINE.map((tradelineData: any) => ({
		creditor: tradelineData.FIRMNAME_ID,
		balance: parseFloat(tradelineData.BALANCEPAYMENT) ?? undefined,
		payment: parseFloat(tradelineData.MONTHLYPAYMENT) ?? undefined,
		creditLimit: parseFloat(tradelineData.CREDITLIMIT) ?? undefined,
		opened: tradelineData.DATEOPENED,
		reportDate: tradelineData.DATEREPORTED,
		accountType: tradelineData.OWNERSHIP.DESCRIPTION,
		utilizationRate: tradelineData.BALANCEPAYMENT / tradelineData.CREDITLIMIT,
	}));
	const recentInquiries = [
		{
			type: 'XPN',
			lastSixMonths: parseInt(reportData.CC_ATTRIB.CCSUMMARY.LAST_6MINQUIRIES) ?? 0,
			lastTwelveMonths: reportData.CC_ATTRIB.CCINQUIRIES.ITEM_INQUIRY?.length ?? 0,
		},
	];

	console.log({
		customer: customerId,
		html: reportLink,
		reportDate: dayjs().toDate(),
		// firstCreditAccount: "",
		monitoringService: 'CBC',
		// state: "",
		// ageOfFile: "",
		// averageAgeOfOpenRevolvingCredit: "",
		// loanPackageAmount: 0,
		creditScores: [
			{
				type: 'XPN',
				score: reportData.SCORES.SCORE,
			},
		],
		recentInquiries,
		tradelines,
		// businessTradelines: [{}].
		// loans: [{}],
		// debtDetails: {};
		// income: {};
		// loanAffordabilityCalculator: {};
	});
	// await CreditEvaluation.create({
	// 	customer: customerId,
	// 	html: reportLink,
	// 	reportDate: dayjs().toDate(),
	// 	// firstCreditAccount: "",
	// 	monitoringService: 'CBC',
	// 	// state: "",
	// 	// ageOfFile: "",
	// 	// averageAgeOfOpenRevolvingCredit: "",
	// 	// loanPackageAmount: 0,
	// 	creditScores: [
	// 		{
	// 			type: 'XPN',
	// 			score: reportData.SCORES.SCORE,
	// 		},
	// 	],
	// 	recentInquiries,
	// 	tradelines,
	// 	// businessTradelines: [{}].
	// 	// loans: [{}],
	// 	// debtDetails: {};
	// 	// income: {};
	// 	// loanAffordabilityCalculator: {};
	// });
};
