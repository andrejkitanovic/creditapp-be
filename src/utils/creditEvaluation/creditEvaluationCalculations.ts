import dayjs from 'dayjs';

import { CreditEvaluationIncomeTypeEnum, ICreditEvaluation } from 'models/creditEvaluation';
import { LeanDocument } from 'mongoose';
import { endOfYear } from 'utils/dayjs';

export const creditEvaluationCalculations = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const calculatedCreditEvaluation: any = creditEvaluation;

	calculatedCreditEvaluation.summaryOfIncomes = calculateSummaryOfIncomes(calculatedCreditEvaluation);
	calculatedCreditEvaluation.debtDetails = calculateDebtDetails(calculatedCreditEvaluation);
	calculatedCreditEvaluation.incomesOverview = calculateIncomesOverview(calculatedCreditEvaluation);
	calculatedCreditEvaluation.loanAffordability = [];

	return calculatedCreditEvaluation;
};

// Single Credit Evaluation Calculations

const calculateSummaryOfIncomes = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const summaryOfIncomes: {
		incomeSources: {
			year: number;
			eoyExpected: number;
			type: CreditEvaluationIncomeTypeEnum;
		}[];
		total: number;
	} = {
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
	const debtDetails: {
		debtPayment: number;
		defferedStudentLoans: number;
		rentPayment: number;
		totalDebtPayment: number;
		spousalDebt: number;
		totalPayment: number;
	} = {
		defferedStudentLoans: 0,
		rentPayment: 0,
		totalDebtPayment: 0,
		spousalDebt: 0,
		totalPayment: 0,
		...creditEvaluation.debtDetails,
	};

	debtDetails.totalDebtPayment = debtDetails.debtPayment + debtDetails.defferedStudentLoans + debtDetails.rentPayment;
	debtDetails.totalPayment = debtDetails.totalDebtPayment + debtDetails.spousalDebt;

	return debtDetails;
};

const calculateIncomesOverview = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const incomesOverview: { source: string; monthly: number; annual: number; dti: number }[] = [];

	const previousYear = dayjs().subtract(1, 'year').get('year');
	const previousYearIncome: { source: string; monthly: number; annual: number; dti: number } = {
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
	previousYearIncome.monthly = previousYearIncome.annual / 12;
	previousYearIncome.dti = (creditEvaluation.debtDetails.totalDebtPayment || 0) / previousYearIncome.monthly;

	incomesOverview.push(previousYearIncome);

	return incomesOverview;
};

export const calculateLoanAffordabilityDetails = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const loanAffordability: {
		source: string;
		rate: number;
		dti: number;

		annualTotal: number;
		monthlyTotal: number;
        monthlyTotalWithDebt: number;

		term60: number;
		term72: number;
		term84: number;
		term120: number;
		term144: number;
	}[] = [];

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	//@ts-expect-error
	creditEvaluation.incomesOverview.forEach((incomeOverview) => {
		const dti = 43;
		const annualTotal = incomeOverview.annual * (dti / 100);
		const monthlyTotal = annualTotal / 12;

		loanAffordability.push({
			source: incomeOverview.source,
			rate: 14,
			dti,

			annualTotal,
			monthlyTotal,
            monthlyTotalWithDebt: monthlyTotal - (creditEvaluation.debtDetails.totalDebtPayment || 0),

			term60: 0,
			term72: 0,
			term84: 0,
			term120: 0,
			term144: 0,
		});
	});

	return loanAffordability;
};
