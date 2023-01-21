import dayjs from 'dayjs';
import { RequestHandler } from 'express';

// import i18n from 'helpers/i18n';
import { queryFilter } from 'helpers/filters';
import { createMeta } from 'helpers/meta';
import CreditEvaluation, {
	CreditEvaluationIncome,
	CreditEvaluationIncomePaystubsEnum,
	CreditEvaluationIncomeTypeEnum,
	ICreditEvaluation,
} from 'models/creditEvaluation';
import { LeanDocument } from 'mongoose';
import { creditEvaluationCalculations } from 'utils/creditEvaluation/creditEvaluationCalculations';
import { startOfYear } from 'utils/dayjs';
import { cbcFormatDate, cbcFormatMonths } from './cbc';

export const getCreditEvaluations: RequestHandler = async (req, res, next) => {
	try {
		const { data: creditEvaluations, count } = await queryFilter({
			Model: CreditEvaluation,
			query: req.query,
			populate: 'customer',
			searchFields: ['customer.firstName', 'customer.lastName'],
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

		let creditEvaluation = (await CreditEvaluation.findById(id)
			.populate('customer')
			.lean()) as LeanDocument<ICreditEvaluation>;

		if (creditEvaluation) {
			creditEvaluation = creditEvaluationCalculations(creditEvaluation);
		}

		res.json({
			data: creditEvaluation,
		});
	} catch (err) {
		next(err);
	}
};

export const calculateIncomes = (type: CreditEvaluationIncomeTypeEnum, period: string, incomes: any[]) => {
	incomes = incomes.sort((incomeA: { date: Date }, incomeB: { date: Date }) =>
		dayjs(incomeA.date).isAfter(dayjs(incomeB.date)) ? 1 : -1
	);

	const result: CreditEvaluationIncome = {
		type,
		incomeSources: [],
	};

	switch (type) {
		case CreditEvaluationIncomeTypeEnum.PAYSTUB:
			result.period = period;

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			result.payStubs = CreditEvaluationIncomePaystubsEnum[period];

			result.averageCheckAmount =
				incomes.reduce((prevValue: number, income: { amount: number }) => {
					return prevValue + income.amount;
				}, 0) / incomes.length;
			result.averageCheckAmountBasedOnYTD =
				incomes.reduce((prevValue: number, income: { date: Date; ytd: number }, index: number) => {
					const year = dayjs(income.date).get('year');
					const dayDiff = Math.round(dayjs(income.date).diff(startOfYear(year), 'days', true));
					const numberOfPeriodsToDate = Math.max((dayDiff / 365) * (result.payStubs || 1), index + 1);
					return prevValue + income.ytd / numberOfPeriodsToDate;
				}, 0) / incomes.length;

			result.incomeSources = incomes.map((income: { date: Date; amount: number; ytd: number }, index: number) => {
				const year = dayjs(income.date).get('year');
				const dayDiff = Math.round(dayjs(income.date).diff(startOfYear(year), 'days', true));
				const numberOfPeriodsToDate = Math.max((dayDiff / 365) * (result.payStubs || 1), index + 1);
				const avgPerPeriod = income.ytd / numberOfPeriodsToDate;
				const numberOfPeriodsRemaining = (result.payStubs || 1) - numberOfPeriodsToDate;
				const amountOfPayRemaining =
					numberOfPeriodsRemaining *
					(((result.averageCheckAmount || 0) + (result.averageCheckAmountBasedOnYTD || 0)) / 2);

				return {
					date: income.date,
					amount: income.amount,
					ytd: income.ytd,
					averageAnnual: income.amount * (result.payStubs || 1),
					numberOfPeriodsToDate,
					avgPerPeriod,
					averageAnnual2: avgPerPeriod * (result.payStubs || 1),
					numberOfPeriodsRemaining,
					amountOfPayRemaining,
					endOfYearExpectedIncome: income.ytd + amountOfPayRemaining,
				};
			});

			break;
		case CreditEvaluationIncomeTypeEnum.SELF_EMPLOYMENT:
			result.incomeSources = incomes.map(
				(income: { date: Date; grossRevenue: number; netProfit: number; annualWages: number }, index: number) => {
					const averageMonthlyGrossRevenue = income.grossRevenue / 12;
					const averageMonthlyNetProfit = income.netProfit / 12;

					let yearOverYearGrossGrowth, yearOverYearNetGrowth;

					if (index !== 0) {
						const previousIncome = incomes[index - 1];
						const previousAverageMonthlyGrossRevenue = previousIncome.grossRevenue / 12;
						const previousMonthlyNetProfit = income.netProfit / 12;

						yearOverYearGrossGrowth = averageMonthlyGrossRevenue / previousAverageMonthlyGrossRevenue;
						yearOverYearNetGrowth = averageMonthlyNetProfit / previousMonthlyNetProfit;
					}

					return {
						date: income.date,
						grossRevenue: income.grossRevenue,
						netProfit: income.netProfit,
						percentageOfProfit: income.netProfit / income.grossRevenue,
						averageMonthlyGrossRevenue,
						averageMonthlyNetProfit: income.netProfit / 12,
						annualWages: income.annualWages,
						mothlyWage: income.annualWages / 12,
						yearOverYearGrossGrowth,
						yearOverYearNetGrowth,
					};
				}
			);

			break;
		case CreditEvaluationIncomeTypeEnum.RETIREMENT_INCOME:
			result.incomeSources = incomes.map((income: { date: Date; source: string; monthlyBenefit: number }) => {
				const monthDiff = Math.round(dayjs(income.date).diff(dayjs(), 'months', true));
				const previousIncomesObject: { [key: string]: { yearIncome: number; months: number } } = {};

				for (let i = 0; i < Math.min(monthDiff, 36); i++) {
					const year = dayjs().subtract(i, 'months').format('YYYY');

					if (previousIncomesObject[year]) {
						previousIncomesObject[year].yearIncome += income.monthlyBenefit;
						previousIncomesObject[year].months += 1;
					} else {
						previousIncomesObject[year] = {
							yearIncome: income.monthlyBenefit,
							months: 1,
						};
					}
				}

				return {
					date: income.date,
					source: income.source,
					monthlyBenefit: income.monthlyBenefit,
					previousIncomes: Object.keys(previousIncomesObject).map((key) => ({
						year: parseInt(key),
						...previousIncomesObject[key],
					})),
				};
			});
			break;
		default:
			break;
	}

	return result;
};

export const postCreditEvaluationIncome: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { type, period } = req.body;
		let { incomes } = req.body;

		incomes = calculateIncomes(type, period, incomes);

		await CreditEvaluation.findByIdAndUpdate(id, { $push: { incomes } });

		res.json({
			// data: result,
		});
	} catch (err) {
		next(err);
	}
};

export const putCreditEvaluationIncome: RequestHandler = async (req, res, next) => {
	try {
		const { id, incomeId } = req.params;
		const { type, period } = req.body;
		let { incomes } = req.body;

		incomes = calculateIncomes(type, period, incomes);

		await CreditEvaluation.findByIdAndUpdate(id, {
			$pull: {
				incomes: { _id: incomeId },
			},
		});
		await CreditEvaluation.findByIdAndUpdate(id, {
			$push: { incomes },
		});

		res.json({
			// data: result,
		});
	} catch (err) {
		next(err);
	}
};

export const deleteCreditEvaluationIncome: RequestHandler = async (req, res, next) => {
	try {
		const { id, incomeId } = req.params;

		await CreditEvaluation.findByIdAndUpdate(id, {
			$pull: {
				incomes: { _id: incomeId },
			},
		});

		res.json({
			// data: result,
		});
	} catch (err) {
		next(err);
	}
};

export const postCreditEvaluationIncomeOverview: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { type, annual } = req.body;

		const incomeOverview = {
			type,
			annual,
			monthly: annual / 12,
		};

		await CreditEvaluation.findByIdAndUpdate(id, {
			$push: { incomesOverview: incomeOverview },
		});

		res.json({
			// data: result,
		});
	} catch (err) {
		next(err);
	}
};

export const putCreditEvaluationDebt: RequestHandler = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { deferredStudentLoans, rentPayment, spouseIncome, spousalDebt, mortgagePayment } = req.body;

		await CreditEvaluation.findByIdAndUpdate(id, {
			'debtDetails.deferredStudentLoans': deferredStudentLoans,
			'debtDetails.rentPayment': rentPayment,
			'debtDetails.spouseIncome': spouseIncome,
			'debtDetails.spousalDebt': spousalDebt,
			'debtDetails.mortgagePayment': mortgagePayment,
		});

		res.json({
			// data: result,
		});
	} catch (err) {
		next(err);
	}
};

// CBC Functions

export const cbcReportToCreditEvaluation = (reportData: any) => {
	// TRADELINES
	let totalOpenTradelines = 0;
	let totalMonthsOfOpenRevolvingCredits = 0;
	let firstTrade: Date | undefined;
	let firstCreditAccount: string | undefined;
	const ageOfFile = dayjs(cbcFormatDate(reportData.CC_ATTRIB.CCSUMMARY.OLDESTTRADE));

	const tradelines =
		reportData.CC_ATTRIB.CCTRADELINES.ITEM_TRADELINE?.filter(
			(tradelineData: any) => tradelineData.CREDITLIMIT !== '-1'
		).map((tradelineData: any) => {
			if (!firstTrade || dayjs(cbcFormatDate(tradelineData.DATEOPENED)).diff(dayjs(firstTrade)) < 0) {
				firstTrade = cbcFormatDate(tradelineData.DATEOPENED);
				firstCreditAccount = tradelineData.FIRMNAME_ID;
			}

			if (tradelineData.OPENIND === 'O' && cbcFormatDate(tradelineData.DATEOPENED)) {
				totalOpenTradelines += 1;
				totalMonthsOfOpenRevolvingCredits += dayjs().diff(dayjs(cbcFormatDate(tradelineData.DATEOPENED)), 'month');
			}

			return {
				status: tradelineData.CLOSEDIND.CODE === 'C' ? 'closed' : 'opened',
				creditor: tradelineData.FIRMNAME_ID,
				balance: parseFloat(tradelineData.BALANCEPAYMENT) ?? undefined,
				payment: parseFloat(tradelineData.MONTHLYPAYMENT) ?? undefined,
				hpb: parseFloat(tradelineData.HIGHCREDIT) ?? undefined,
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
			inquiries: inquiries?.map((inquiryItem: { SUBSCRNAME: string; DATE: string }) => ({
				name: inquiryItem.SUBSCRNAME,
				date: cbcFormatDate(inquiryItem.DATE),
			})),
		},
	];

	// LOANS
	const loans =
		reportData.CC_ATTRIB.CCTRADELINES.ITEM_TRADELINE?.filter(
			(tradelineData: any) => tradelineData.CREDITLIMIT === '-1'
		).map((tradelineData: any) => {
			return {
				status: tradelineData.CLOSEDIND.CODE === 'C' ? 'closed' : 'opened',
				creditor: tradelineData.FIRMNAME_ID,
				balance: parseFloat(tradelineData.BALANCEPAYMENT) ?? undefined,
				payment: parseFloat(tradelineData.MONTHLYPAYMENT) ?? undefined,
				hpb: parseFloat(tradelineData.HIGHCREDIT) ?? undefined,
				limit: cbcFormatMonths(tradelineData.TERMS),
				opened: cbcFormatDate(tradelineData.DATEOPENED),
				reportDate: cbcFormatDate(tradelineData.DATEREPORTED),
				accountType: tradelineData.OWNERSHIP.DESCRIPTION,
				debitToCreditRatio: tradelineData.BALANCEPAYMENT / tradelineData.HIGHCREDIT,
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
