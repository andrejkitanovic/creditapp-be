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
						startDate: dayjs(incomeSource.date).toDate(),
						year: dayjs(incomeSource.date).get('year'),
						eoyExpected: incomeSource.endOfYearExpectedIncome || 0,
						type: income.type,
					});
					break;
				case CreditEvaluationIncomeTypeEnum.SELF_EMPLOYMENT:
					break;
				case CreditEvaluationIncomeTypeEnum.RETIREMENT_INCOME:
				case CreditEvaluationIncomeTypeEnum.HOUSING_ALLOWANCE:
					summaryOfIncomes.incomeSources.push({
						startDate: dayjs(incomeSource.date).toDate(),
						year: currentYear,
						eoyExpected: 12 * (incomeSource.monthlyBenefit || 0),
						type: income.type,
					});

					incomeSource.previousIncomes?.forEach((previousIncome) => {
						if (previousIncome.year >= last3Years && previousIncome.year < currentYear) {
							summaryOfIncomes.incomeSources.push({
								startDate: dayjs(incomeSource.date).toDate(),
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

	summaryOfIncomes.incomeSources = summaryOfIncomes.incomeSources.filter((incomeSource) => {
		if (incomeSource.type === CreditEvaluationIncomeTypeEnum.PAYSTUB) {
			return !summaryOfIncomes.incomeSources.some((comparedIncomeSource) => {
				if (
					comparedIncomeSource.type === CreditEvaluationIncomeTypeEnum.PAYSTUB &&
					comparedIncomeSource.year === incomeSource.year
				) {
					return dayjs(comparedIncomeSource.startDate).isAfter(dayjs(incomeSource.startDate));
				}
			});
		}

		return true;
	});

	return summaryOfIncomes;
};

const calculateDebtDetails = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const debtDetails: CreditEvaluationDebtDetails = {
		...creditEvaluation.debtDetails,
	};

	debtDetails.totalDebtPayment =
		(debtDetails.debtPayment || 0) + (debtDetails.deferredStudentLoans || 0) + (debtDetails.rentPayment || 0);
	debtDetails.totalPayment =
		debtDetails.totalDebtPayment +
		(debtDetails.spousalDebt || 0) -
		(debtDetails.mortgagePayment ? debtDetails.mortgagePayment / 2 : 0);

	return debtDetails;
};

const calculateIncomesOverview = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	let incomesOverview: CreditEvaluationIncomeOverview[] = [];

	const currentYear = dayjs().get('year');
	const previousYear = dayjs().subtract(1, 'year').get('year');
	const before2Years = dayjs().subtract(2, 'year').get('year');

	const currentYearIncome: CreditEvaluationIncomeOverview = {
		type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_CURRENT_YEAR,
		monthly: 0,
		annual: 0,
		dti: 0,
	};
	const priorYearIncome: CreditEvaluationIncomeOverview = {
		type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_PRIOR_YEAR,
		monthly: 0,
		annual: 0,
		dti: 0,
	};
	const prior2YearIncome: Omit<CreditEvaluationIncomeOverview, 'type'> = {
		monthly: 0,
		annual: 0,
		dti: 0,
	};

	creditEvaluation.summaryOfIncomes.incomeSources?.forEach((income) => {
		switch (income.year) {
			case currentYear:
				currentYearIncome.annual += income.eoyExpected;

				break;
			case previousYear:
				priorYearIncome.annual += income.eoyExpected;

				break;
			case before2Years:
				prior2YearIncome.annual += income.eoyExpected;

				break;
			default:
				break;
		}
	});

	if (currentYearIncome.annual) {
		incomesOverview.push(currentYearIncome);
	}
	if (priorYearIncome.annual) {
		incomesOverview.push(priorYearIncome);

		if (creditEvaluation.debtDetails.deferredStudentLoans) {
			incomesOverview.push({
				...priorYearIncome,
				type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_STUDENT_LOAN_ADJUSTED,
				annual: priorYearIncome.annual - creditEvaluation.debtDetails.deferredStudentLoans * 12,
			});
		}
		if (creditEvaluation.debtDetails.rentPayment) {
			incomesOverview.push({
				...priorYearIncome,
				type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_RENT_ADJUSTED,
				annual: priorYearIncome.annual - creditEvaluation.debtDetails.rentPayment * 12,
			});
		}
		if (creditEvaluation.debtDetails.spouseIncome) {
			incomesOverview.push({
				...priorYearIncome,
				type: CreditEvaluationIncomeOverviewEnum.HOUSEHOLD_INCOME,
				annual:
					priorYearIncome.annual +
					creditEvaluation.debtDetails.spouseIncome * 12 -
					(creditEvaluation.debtDetails.spousalDebt || 0) * 12,
			});
		}

		incomesOverview.push({
			...priorYearIncome,
			type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_2_YEAR_AVERAGE,
			annual: (priorYearIncome.annual + currentYearIncome.annual) / 2,
		});

		if (prior2YearIncome.annual) {
			incomesOverview.push({
				...priorYearIncome,
				type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_3_YEAR_AVERAGE,
				annual: (prior2YearIncome.annual + priorYearIncome.annual + currentYearIncome.annual) / 2,
			});
		}
	}

	// Calculate DTI
	incomesOverview = incomesOverview.map((incomeOverview) => ({
		...incomeOverview,
		monthly: incomeOverview.annual / 12,
	}));
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
