import dayjs from 'dayjs';

import {
	CreditEvaluationDebtDetails,
	CreditEvaluationIncomeOverview,
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

	creditEvaluation.incomes.forEach((income) => {
		income.incomeSources.forEach((incomeSource) => {
			switch (income.type) {
				case CreditEvaluationIncomeTypeEnum.PAYSTUB:
					if (dayjs(incomeSource.date).get('year') !== currentYear) {
						break;
					}

					summaryOfIncomes.incomeSources.push({
						year: currentYear,
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
					break;
				default:
					break;
			}
		});
	});

	summaryOfIncomes.total = summaryOfIncomes.incomeSources.reduce(
		(prevValue, incomeSource) => prevValue + incomeSource.eoyExpected,
		0
	);

	return summaryOfIncomes;
};

const calculateDebtDetails = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const debtDetails: CreditEvaluationDebtDetails = {
		...creditEvaluation.debtDetails,
	};

	debtDetails.totalDebtPayment =
		(debtDetails.debtPayment || 0) + (debtDetails.defferedStudentLoans || 0) + (debtDetails.rentPayment || 0);
	debtDetails.totalPayment = debtDetails.totalDebtPayment + (debtDetails.spousalDebt || 0);

	return debtDetails;
};

const calculateIncomesOverview = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const incomesOverview: CreditEvaluationIncomeOverview[] = [];

	const previousYear = dayjs().subtract(1, 'year').get('year');
	const previousYearIncome: CreditEvaluationIncomeOverview = {
		type: 'auto',
		source: 'Previous Year Income',
		monthly: 0,
		annual: 0,
		dti: 0,
	};

	creditEvaluation.incomes.forEach((income) => {
		income.incomeSources.forEach((incomeSource) => {
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
		previousYearIncome.dti = (creditEvaluation.debtDetails.totalDebtPayment || 0) / previousYearIncome.monthly;

		incomesOverview.push(previousYearIncome);
	}

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
			source: incomeOverview.source,
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
