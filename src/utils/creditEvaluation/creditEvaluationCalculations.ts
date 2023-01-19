import dayjs from 'dayjs';

import {
	CreditEvaluationDebtDetails,
	CreditEvaluationIncomeOverview,
	CreditEvaluationIncomeOverviewEnum,
	CreditEvaluationIncomeTypeEnum,
	CreditEvaluationLoanAffordability,
	CreditEvaluationSummaryOfIncomes,
	ICreditEvaluation,
} from 'models/creditEvaluation';
import { LeanDocument } from 'mongoose';
import { endOfYear } from 'utils/dayjs';

export const creditEvaluationCalculations = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	creditEvaluation.summaryOfIncomes = calculateSummaryOfIncomes(creditEvaluation);
	creditEvaluation.debtDetails = calculateDebtDetails(creditEvaluation);
	creditEvaluation.incomesOverview = calculateIncomesOverview(creditEvaluation);
	creditEvaluation.loanAffordability = calculateLoanAffordability(creditEvaluation);
	return creditEvaluation;
};

// Single Credit Evaluation Calculations

const calculateSummaryOfIncomes = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const summaryOfIncomes: CreditEvaluationSummaryOfIncomes = {
		incomeSources: [],
		total: 0,
	};

	const currentYear = dayjs().get('year');
	const last3Years = dayjs().subtract(3, 'year').get('year');

	creditEvaluation.incomes?.forEach((income) => {
		income.incomeSources?.forEach((incomeSource) => {
			switch (income.type) {
				case CreditEvaluationIncomeTypeEnum.PAYSTUB:
					if (dayjs(incomeSource.date).get('year') < last3Years) {
						break;
					}

					summaryOfIncomes.incomeSources.push({
						year: dayjs(incomeSource.date).get('year'),
						eoyExpected: incomeSource.endOfYearExpectedIncome || 0,
						type: income.type,
					});
					break;
				case CreditEvaluationIncomeTypeEnum.SELF_EMPLOYMENT:
					break;
				case CreditEvaluationIncomeTypeEnum.RETIREMENT_INCOME:
					// eslint-disable-next-line no-case-declarations
					const monthDiff = Math.floor(endOfYear(currentYear).diff(dayjs(), 'months', true));

					summaryOfIncomes.incomeSources.push({
						year: currentYear,
						eoyExpected: monthDiff * (incomeSource.monthlyBenefit || 0),
						type: income.type,
					});

					incomeSource.previousIncomes?.forEach((previousIncome) => {
						if (previousIncome.year >= last3Years && previousIncome.year < currentYear) {
							summaryOfIncomes.incomeSources.push({
								year: previousIncome.year,
								eoyExpected: previousIncome.yearIncome,
								type: income.type,
							});
						}
					});
					break;
				default:
					break;
			}
		});
	});

	summaryOfIncomes.total = summaryOfIncomes.incomeSources.reduce((prevValue, incomeSource) => {
		if (incomeSource.year === currentYear) {
			return prevValue + incomeSource.eoyExpected;
		}
		return prevValue;
	}, 0);

	return summaryOfIncomes;
};

const calculateDebtDetails = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const debtDetails: CreditEvaluationDebtDetails = {
		...creditEvaluation.debtDetails,
	};

	debtDetails.totalDebtPayment =
		(debtDetails.debtPayment || 0) + (debtDetails.deferredStudentLoans || 0) + (debtDetails.rentPayment || 0);
	debtDetails.totalPayment = debtDetails.totalDebtPayment + (debtDetails.spousalDebt || 0);

	return debtDetails;
};

const calculateIncomesOverview = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	let incomesOverview: CreditEvaluationIncomeOverview[] = [
		...(creditEvaluation.incomesOverview?.filter(
			(incomeOverview) => incomeOverview.type !== CreditEvaluationIncomeOverviewEnum.CURRENT_INCOME
		) || []),
	];

	const previousYear = dayjs().subtract(1, 'year').get('year');
	const previousYearIncome: CreditEvaluationIncomeOverview = {
		type: CreditEvaluationIncomeOverviewEnum.CURRENT_INCOME,
		monthly: 0,
		annual: 0,
		dti: 0,
	};

	creditEvaluation.incomes?.forEach((income) => {
		income.incomeSources?.forEach((incomeSource) => {
			switch (income.type) {
				case CreditEvaluationIncomeTypeEnum.PAYSTUB:
					if (dayjs(incomeSource.date).get('year') !== previousYear) {
						break;
					}

					previousYearIncome.annual += incomeSource.endOfYearExpectedIncome || 0;
					break;
				case CreditEvaluationIncomeTypeEnum.SELF_EMPLOYMENT:
					if (dayjs(incomeSource.date).get('year') !== previousYear) {
						break;
					}

					previousYearIncome.annual += incomeSource.netProfit || 0;
					break;
				case CreditEvaluationIncomeTypeEnum.RETIREMENT_INCOME:
					incomeSource.previousIncomes?.forEach((previousRetirementIncome) => {
						if (previousRetirementIncome.year === previousYear) {
							previousYearIncome.annual += previousRetirementIncome.yearIncome;
						}
					});
					break;
				default:
					break;
			}
		});
	});

	if (previousYearIncome.annual) {
		previousYearIncome.monthly = previousYearIncome.annual / 12;

		incomesOverview.push(previousYearIncome);
	}

	// Calculate DTI
	incomesOverview = incomesOverview.map((incomeOverview) => ({
		...incomeOverview,
		dti: (creditEvaluation.debtDetails.totalDebtPayment || 0) / incomeOverview.monthly,
	}));

	return incomesOverview;
};

const calculateLoanAffordability = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const loanAffordability: CreditEvaluationLoanAffordability[] = [];

	creditEvaluation.incomesOverview.forEach((incomeOverview) => {
		const rate = 14;
		const dti = 43;
		const annualTotal = incomeOverview.annual * (dti / 100);
		const monthlyTotal = annualTotal / 12;
		const monthlyTotalWithDebt = monthlyTotal - (creditEvaluation.debtDetails.totalDebtPayment || 0);

		loanAffordability.push({
			source: incomeOverview.type,
			rate: 14,
			dti,

			annualTotal,
			monthlyTotal,
			monthlyTotalWithDebt,

			term60: calculatePV(rate / 100 / 12, 60, monthlyTotalWithDebt),
			term72: calculatePV(rate / 100 / 12, 72, monthlyTotalWithDebt),
			term84: calculatePV(rate / 100 / 12, 84, monthlyTotalWithDebt),
			term120: calculatePV(rate / 100 / 12, 120, monthlyTotalWithDebt),
			term144: calculatePV(rate / 100 / 12, 144, monthlyTotalWithDebt),
		});
	});

	return loanAffordability;
};

function calculatePV(rate: number, nper: number, pmt: number) {
	return (pmt / rate) * (1 - Math.pow(1 + rate, -nper));
}
