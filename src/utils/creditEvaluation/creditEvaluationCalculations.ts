import dayjs from 'dayjs';

import CreditEvaluation, {
	CreditEvaluationDebtDetails,
	CreditEvaluationIncomeOverview,
	CreditEvaluationIncomeOverviewEnum,
	CreditEvaluationIncomeTypeEnum,
	CreditEvaluationLoanAffordability,
	CreditEvaluationLoanAffordabilityEnum,
	CreditEvaluationSummaryOfIncomes,
	ICreditEvaluation,
} from 'models/creditEvaluation';
import Customer from 'models/customer';
import { LeanDocument } from 'mongoose';

export const creditEvaluationCalculations = async (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	creditEvaluation.summaryOfIncomes = calculateSummaryOfIncomes(creditEvaluation);
	creditEvaluation.debtDetails = await calculateDebtDetails(creditEvaluation, true);
	creditEvaluation.incomesOverview = calculateIncomesOverview(creditEvaluation);
	creditEvaluation.loanAffordability = await calculateLoanAffordability(creditEvaluation);
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
		let paystubIncomes: CreditEvaluationSummaryOfIncomes['incomeSources'] = [];

		income.incomeSources?.reverse().forEach((incomeSource) => {
			switch (income.type) {
				case CreditEvaluationIncomeTypeEnum.PAYSTUB:
					if (dayjs(incomeSource.date).get('year') < last3Years) {
						break;
					}

					// eslint-disable-next-line no-case-declarations
					const incomeSameYear = paystubIncomes.find((income) => income.year === dayjs(incomeSource.date).get('year'));
					if (incomeSameYear) {
						if (!dayjs(incomeSameYear.startDate).isAfter(incomeSource.date)) {
							paystubIncomes = paystubIncomes.filter((income) => income.startDate !== incomeSameYear.startDate);

							paystubIncomes.push({
								startDate: dayjs(incomeSource.date).toDate(),
								year: dayjs(incomeSource.date).get('year'),
								eoyExpected: incomeSource.endOfYearExpectedIncome || 0,
								type: income.type,
							});
						}
					} else {
						paystubIncomes.push({
							startDate: dayjs(incomeSource.date).toDate(),
							year: dayjs(incomeSource.date).get('year'),
							eoyExpected: incomeSource.endOfYearExpectedIncome || 0,
							type: income.type,
						});
					}

					break;
				case CreditEvaluationIncomeTypeEnum.SELF_EMPLOYMENT:
					summaryOfIncomes.incomeSources.push({
						startDate: dayjs(incomeSource.date).toDate(),
						year: dayjs(incomeSource.date).get('year'),
						eoyExpected: incomeSource.netProfit || 0,
						type: income.type,
					});

					break;
				case CreditEvaluationIncomeTypeEnum.ADDITIONAL_INCOME:
				case CreditEvaluationIncomeTypeEnum.HOUSING_ALLOWANCE:
					summaryOfIncomes.incomeSources.push({
						startDate: dayjs(incomeSource.date).toDate(),
						year: currentYear,
						source: incomeSource.source,
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

		summaryOfIncomes.incomeSources.push(...paystubIncomes);
	});

	return summaryOfIncomes;
};

const calculateDebtDetails = async (creditEvaluation: LeanDocument<ICreditEvaluation>, includeHousehold: boolean) => {
	const debtDetails: CreditEvaluationDebtDetails = {
		...creditEvaluation.debtDetails,
	};

	debtDetails.calculatedDeferredStudentLoans =
		creditEvaluation.loans.reduce((prevValue, loan) => {
			if (loan.payment !== -1) {
				return prevValue;
			}

			return (prevValue += loan.balance);
		}, 0) * 0.01;
	if (!debtDetails.deferredStudentLoans) {
		debtDetails.deferredStudentLoans = debtDetails.calculatedDeferredStudentLoans;
	}

	debtDetails.totalDebtPayment =
		(debtDetails.debtPayment || 0) + (debtDetails.deferredStudentLoans || 0) + (debtDetails.rentPayment || 0);
	debtDetails.totalPayment =
		debtDetails.totalDebtPayment - (debtDetails.mortgagePayment ? debtDetails.mortgagePayment / 2 : 0);

	if (includeHousehold) {
		const customer = await Customer.findById(creditEvaluation.customer);
		if (customer?.spouse) {
			const spouseCreditEval = (await CreditEvaluation.findOne({
				customer: customer.spouse,
			}).lean()) as ICreditEvaluation;
			spouseCreditEval.summaryOfIncomes = calculateSummaryOfIncomes(spouseCreditEval);
			spouseCreditEval.debtDetails = await calculateDebtDetails(spouseCreditEval, false);
			spouseCreditEval.incomesOverview = calculateIncomesOverview(spouseCreditEval);

			if (spouseCreditEval.selectedHouseholdIncome) {
				debtDetails.spouseIncome =
					spouseCreditEval.incomesOverview.find((income) => income.type === spouseCreditEval.selectedHouseholdIncome)
						?.monthly ?? 0;
			}
			debtDetails.spousalDebt = spouseCreditEval.debtDetails.totalDebtPayment;
		}

		debtDetails.totalPayment =
			debtDetails.totalDebtPayment +
			(debtDetails.spousalDebt || 0) -
			(debtDetails.mortgagePayment ? debtDetails.mortgagePayment / 2 : 0);
	}

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
		if (creditEvaluation.debtDetails.mortgagePayment) {
			incomesOverview.push({
				...priorYearIncome,
				type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_HALF_MORTGAGE,
				annual: priorYearIncome.annual - creditEvaluation.debtDetails.mortgagePayment * 6,
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
	if (creditEvaluation.statedMonthlyIncome) {
		incomesOverview.push({
			type: CreditEvaluationIncomeOverviewEnum.STATED_INCOME,
			dti: 0,
			monthly: creditEvaluation.statedMonthlyIncome,
			annual: creditEvaluation.statedMonthlyIncome * 12,
		});
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

const calculateLoanAffordability = async (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const loanAffordabilitiesRaw: { source: CreditEvaluationLoanAffordabilityEnum; annual: number; debt: number }[] = [];
	const loanAffordabilities: CreditEvaluationLoanAffordability[] = [];
	const rate = creditEvaluation.loanAffordabilityRate || 14;
	const dti = 43;

	if (creditEvaluation.selectedHouseholdIncome) {
		const selectedIncome = creditEvaluation.incomesOverview.find(
			(income) => income.type === creditEvaluation.selectedHouseholdIncome
		) as CreditEvaluationIncomeOverview;

		loanAffordabilitiesRaw.push({
			source: CreditEvaluationLoanAffordabilityEnum.SELECTED_INCOME,
			annual: selectedIncome.annual,
			debt: creditEvaluation.debtDetails.debtPayment,
		});

		if (creditEvaluation.debtDetails.deferredStudentLoans) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFORDABILITY_INCLUDING_STUDENT_LOAN_DEBT,
				annual: selectedIncome.annual,
				debt: creditEvaluation.debtDetails.debtPayment + creditEvaluation.debtDetails.deferredStudentLoans,
			});
		}
		if (creditEvaluation.debtDetails.rentPayment) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFORDABILITY_INCLUDING_RENT,
				annual: selectedIncome.annual,
				debt: creditEvaluation.debtDetails.debtPayment + creditEvaluation.debtDetails.rentPayment,
			});
		}
		if (creditEvaluation.debtDetails.deferredStudentLoans && creditEvaluation.debtDetails.rentPayment) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFORDABILITY_INCLUDING_RENT_AND_DEFERRED_STUDENT_LOANS,
				annual: selectedIncome.annual,
				debt:
					creditEvaluation.debtDetails.debtPayment +
					creditEvaluation.debtDetails.rentPayment +
					creditEvaluation.debtDetails.deferredStudentLoans,
			});
		}
		if (creditEvaluation.debtDetails.mortgagePayment) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFRODABILITY_HALF_MORTAGE,
				annual: selectedIncome.annual,
				debt: creditEvaluation.debtDetails.debtPayment - creditEvaluation.debtDetails.mortgagePayment / 2,
			});
		}

		// SPOUSE

		const customer = await Customer.findById(creditEvaluation.customer);
		if (customer?.spouse) {
			const spouseCreditEval = (await CreditEvaluation.findOne({
				customer: customer.spouse,
			}).lean()) as ICreditEvaluation;

			if (creditEvaluation.debtDetails.spouseIncome) {
				loanAffordabilitiesRaw.push({
					source: CreditEvaluationLoanAffordabilityEnum.HOUSEHOLD_INCOME,
					annual: selectedIncome.annual + creditEvaluation.debtDetails.spouseIncome * 12,
					debt:
						creditEvaluation.debtDetails.debtPayment -
						creditEvaluation.debtDetails.mortgagePayment / 2 +
						(spouseCreditEval.debtDetails.debtPayment - creditEvaluation.debtDetails.mortgagePayment / 2),
				});
			}

			if (
				creditEvaluation.debtDetails.spouseIncome &&
				(creditEvaluation.debtDetails.deferredStudentLoans || spouseCreditEval.debtDetails.deferredStudentLoans)
			) {
				loanAffordabilitiesRaw.push({
					source:
						CreditEvaluationLoanAffordabilityEnum.HOUSEHOLD_AFFORDABILITY_INCLUDING_RENT_AND_DEFERRED_STUDENT_LOANS,
					annual: selectedIncome.annual + creditEvaluation.debtDetails.spouseIncome * 12,
					debt:
						creditEvaluation.debtDetails.debtPayment -
						creditEvaluation.debtDetails.mortgagePayment / 2 +
						(spouseCreditEval.debtDetails.debtPayment - creditEvaluation.debtDetails.mortgagePayment / 2) +
						(creditEvaluation.debtDetails.deferredStudentLoans || 0) +
						(spouseCreditEval.debtDetails.deferredStudentLoans || 0),
				});
			}
			if (
				creditEvaluation.debtDetails.spouseIncome &&
				(creditEvaluation.debtDetails.rentPayment || spouseCreditEval.debtDetails.rentPayment)
			) {
				loanAffordabilitiesRaw.push({
					source: CreditEvaluationLoanAffordabilityEnum.HOUSEHOLD_AFFORDABILITY_INCLUDING_RENT,
					annual: selectedIncome.annual + creditEvaluation.debtDetails.spouseIncome * 12,
					debt:
						creditEvaluation.debtDetails.debtPayment -
						creditEvaluation.debtDetails.mortgagePayment / 2 +
						(spouseCreditEval.debtDetails.debtPayment - creditEvaluation.debtDetails.mortgagePayment / 2) +
						(creditEvaluation.debtDetails.rentPayment || 0) +
						(spouseCreditEval.debtDetails.rentPayment || 0),
				});
			}
			if (
				creditEvaluation.debtDetails.spouseIncome &&
				(creditEvaluation.debtDetails.deferredStudentLoans || spouseCreditEval.debtDetails.deferredStudentLoans) &&
				(creditEvaluation.debtDetails.rentPayment || spouseCreditEval.debtDetails.rentPayment)
			) {
				loanAffordabilitiesRaw.push({
					source:
						CreditEvaluationLoanAffordabilityEnum.HOUSEHOLD_AFFORDABILITY_INCLUDING_RENT_AND_DEFERRED_STUDENT_LOANS,
					annual: selectedIncome.annual + creditEvaluation.debtDetails.spouseIncome * 12,
					debt:
						creditEvaluation.debtDetails.debtPayment -
						creditEvaluation.debtDetails.mortgagePayment / 2 +
						(spouseCreditEval.debtDetails.debtPayment - creditEvaluation.debtDetails.mortgagePayment / 2) +
						(creditEvaluation.debtDetails.deferredStudentLoans || 0) +
						(spouseCreditEval.debtDetails.deferredStudentLoans || 0) +
						(creditEvaluation.debtDetails.rentPayment || 0) +
						(spouseCreditEval.debtDetails.rentPayment || 0),
				});
			}
		}
	}

	loanAffordabilitiesRaw.forEach((loanAffordabilityRaw) => {
		const annualTotal = loanAffordabilityRaw.annual * (dti / 100);
		const monthlyTotal = annualTotal / 12;
		const monthlyTotalWithDebt = monthlyTotal - loanAffordabilityRaw.debt;

		loanAffordabilities.push({
			source: loanAffordabilityRaw.source,
			rate,
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

	return loanAffordabilities;
};

function calculatePV(rate: number, nper: number, pmt: number) {
	return (pmt / rate) * (1 - Math.pow(1 + rate, -nper));
}
