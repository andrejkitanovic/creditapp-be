import dayjs from 'dayjs';
import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import CreditEvaluation from 'models/creditEvaluation';
import { startOfYear } from 'utils/dayjs';
import { cbcFormatDate, cbcFormatMonths } from './cbc';

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

		const creditEvaluation = await CreditEvaluation.findById(id).populate('customer');

		res.json({
			data: creditEvaluation,
		});
	} catch (err) {
		next(err);
	}
};

const periodMultiplier = {
	weekly: 52,
	'bi-weekly': 26,
	monthly: 12,
	quarterly: 4,
	'bi-monthly': 24,
	annual: 1,
};
export const postCreditEvaluationIncome: RequestHandler = async (req, res, next) => {
	try {
		// const { id } = req.params;
		const { type, period, incomes } = req.body;

		const result: {
			type: 'paystub' | 'self-employment' | 'retirement-income';
			period?: string;
			averageCheckAmount?: number;
			averageCheckAmountBasedOnYTD?: number;
			payStubs?: number;
			incomes: any[];
		} = {
			type,
			incomes: [],
		};

		switch (type) {
			case 'paystub':
				result.period = period;

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				//@ts-expect-error
				result.payStubs = periodMultiplier[period];

				result.averageCheckAmount =
					incomes.reduce((prevValue: number, income: { amount: number }) => {
						return prevValue + income.amount;
					}, 0) / incomes.length;
				result.averageCheckAmountBasedOnYTD = incomes.reduce(
					(prevValue: number, income: { date: Date; ytd: number }, index: number) => {
						const numberOfPeriodsToDate = Math.max(
							(dayjs(income.date).diff(startOfYear, 'days') / 365) * (result.payStubs || 1),
							index + 1
						);
						return prevValue + income.ytd / numberOfPeriodsToDate;
					},
					0
				);

				result.incomes = incomes.map((income: { date: Date; amount: number; ytd: number }, index: number) => {
					const numberOfPeriodsToDate = Math.max(
						(dayjs(income.date).diff(startOfYear, 'days') / 365) * (result.payStubs || 1),
						index + 1
					);
					const avgPerPeriod = income.ytd / numberOfPeriodsToDate;
					const numberOfPeriodsRemaining = (result.payStubs || 1) - numberOfPeriodsToDate;
					// const amountOfPayRemaining = numberOfPeriodsRemaining *

					return {
						date: income.date,
						amount: income.amount,
						ytd: income.ytd,
						avgAnnual: income.amount * (result.payStubs || 1),

						numberOfPeriodsToDate,
						avgPerPeriod,
						avgAnnual2: avgPerPeriod * (result.payStubs || 1),
						numberOfPeriodsRemaining,
						// amountOfPayRemaining,
						// endOfYearExpectedIncome:
					};
				});

				break;
			case 'self-employment':
				result.incomes = incomes.map((income: { date: Date; grossRevenue: number; netProfit: number }) => {
					return {
						date: income.date,
						grossRevenue: income.grossRevenue,
						netProfit: income.netProfit,
						percentageOfProfit: income.netProfit / income.grossRevenue,
						averageMonthlyGrossRevenue: income.grossRevenue / 12,
						averageMonthlyNetProfit: income.netProfit / 12,
					};
				});
				break;
			case 'retirement-income':
				result.incomes = incomes.map((income: { date: Date; source: string; monthlyBenefit: number }) => {
					return {
						date: income.date,
						source: income.source,
						monthlyBenefit: income.monthlyBenefit,
					};
				});
				break;
			default:
				break;
		}

		res.json({
			data: result,
		});
	} catch (err) {
		next(err);
	}
};

// Other Functions

export const cbcReportToCreditEvaluation = (reportData: any) => {
	// TRADELINES
	let totalOpenTradelines = 0;
	let totalMonthsOfOpenRevolvingCredits = 0;
	let ageOfFile: Date | undefined;
	let firstCreditAccount: string | undefined;

	const tradelines =
		reportData.CC_ATTRIB.CCTRADELINES.ITEM_TRADELINE?.filter(
			(tradelineData: any) => tradelineData.CREDITLIMIT !== '-1'
		).map((tradelineData: any) => {
			if (!ageOfFile || dayjs(cbcFormatDate(tradelineData.DATEOPENED)).diff(dayjs(ageOfFile)) < 0) {
				ageOfFile = cbcFormatDate(tradelineData.DATEOPENED);
				firstCreditAccount = tradelineData.FIRMNAME_ID;
			}

			if (tradelineData.OPENIND === 'O' && cbcFormatDate(tradelineData.DATEOPENED)) {
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
				utilizationRate:
					parseFloat(tradelineData.BALANCEPAYMENT) && parseFloat(tradelineData.CREDITLIMIT)
						? parseFloat(tradelineData.BALANCEPAYMENT) / parseFloat(tradelineData.CREDITLIMIT)
						: 0,
			};
		}) || [];

	// INQUIRES
	let inquiries = reportData.CC_ATTRIB.CCINQUIRIES.ITEM_INQUIRY;
	if (Boolean(inquiries) && !Array.isArray(inquiries)) {
		inquiries = [inquiries];
	}

	const lastTwelveMonths =
		inquiries?.filter((inquiryItem: { DATE: string }) => {
			return dayjs().diff(dayjs(cbcFormatDate(inquiryItem.DATE)), 'year', true) <= 1;
		}) || [];

	const recentInquiries = [
		{
			type: 'XPN',
			lastSixMonths: parseInt(reportData.CC_ATTRIB.CCSUMMARY.LAST_6MINQUIRIES) ?? 0,
			lastTwelveMonths: lastTwelveMonths.length ?? 0,
		},
	];

	// LOANS
	const loans =
		reportData.CC_ATTRIB.CCTRADELINES.ITEM_TRADELINE?.filter(
			(tradelineData: any) => tradelineData.CREDITLIMIT === '-1'
		).map((tradelineData: any) => {
			const paydown75 = tradelineData.BALANCEPAYMENT - tradelineData.HIGHCREDIT * 0.75;
			const paydown60 = tradelineData.BALANCEPAYMENT - tradelineData.HIGHCREDIT * 0.6;

			return {
				creditor: tradelineData.FIRMNAME_ID,
				balance: parseFloat(tradelineData.BALANCEPAYMENT) ?? undefined,
				payment: parseFloat(tradelineData.MONTHLYPAYMENT) ?? undefined,
				limit: cbcFormatMonths(tradelineData.TERMS),
				opened: cbcFormatDate(tradelineData.DATEOPENED),
				reportDate: cbcFormatDate(tradelineData.DATEREPORTED),
				accountType: tradelineData.OWNERSHIP.DESCRIPTION,
				debitToCreditRatio: tradelineData.BALANCEPAYMENT / tradelineData.HIGHCREDIT,
				paydown75: paydown75 < 0 ? 0 : paydown75,
				paydown60: paydown60 < 0 ? 0 : paydown60,
			};
		}) || [];

	const averageMonthsOfOpenRevolvingCredit = totalMonthsOfOpenRevolvingCredits / totalOpenTradelines;

	// DEBT
	const debtPayment =
		reportData.CC_ATTRIB.CCTRADELINES.ITEM_TRADELINE?.reduce((prevValue: number, currValue: any) => {
			if (currValue.OPENIND === 'O' && parseFloat(currValue.MONTHLYPAYMENT) > 0) {
				prevValue += parseFloat(currValue.MONTHLYPAYMENT);
			}

			return prevValue;
		}, 0) || [];

	return {
		reportDate: dayjs().toDate(),
		firstCreditAccount,
		monitoringService: 'CBC',
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
		loans,
		debtDetails: {
			debtPayment,
		},
		// loanAffordabilityCalculator: {};
	};
};
