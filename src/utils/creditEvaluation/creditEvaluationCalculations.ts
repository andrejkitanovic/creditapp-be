import dayjs from 'dayjs';

import CreditEvaluation, {
	CreditEvaluationDebtDetails,
	CreditEvaluationIncomeOverview,
	CreditEvaluationIncomeOverviewEnum,
	CreditEvaluationLoanAffordability,
	CreditEvaluationLoanAffordabilityEnum,
	ICreditEvaluation,
} from 'models/creditEvaluation';
import Customer, { CustomerIncome } from 'models/customer';
import { LeanDocument } from 'mongoose';

export const creditEvaluationCalculations = async (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	let spouseCreditEvaluation;
	const customer = await Customer.findById(creditEvaluation.customer).select('spouse incomes summaryOfIncomes').lean();
	if (customer?.spouse) {
		spouseCreditEvaluation = await CreditEvaluation.findOne({ customer: customer.spouse }).sort('createdAt').lean();
	}

	//@ts-expect-error
	creditEvaluation.incomes = (customer.incomes ?? []) as CustomerIncome[];
	//@ts-expect-error
	creditEvaluation.summaryOfIncomes = customer?.summaryOfIncomes;

	creditEvaluation.tradelines = jointTradelines(creditEvaluation, spouseCreditEvaluation);
	creditEvaluation.loans = jointLoans(creditEvaluation, spouseCreditEvaluation);
	creditEvaluation.debtDetails = await calculateDebtDetails(creditEvaluation, true);
	creditEvaluation.incomesOverview = calculateIncomesOverview(creditEvaluation);
	creditEvaluation.loanAffordability = await calculateLoanAffordability(creditEvaluation);
	return creditEvaluation;
};

const jointTradelines = (
	creditEvaluation: LeanDocument<ICreditEvaluation>,
	spouseCreditEvaluation: LeanDocument<ICreditEvaluation> | null | undefined
) => {
	return creditEvaluation.tradelines.map((tradeline) => {
		return {
			joint:
				tradeline.accountType === 'Joint Account' &&
				spouseCreditEvaluation?.tradelines.some(
					(spouseTradeline) =>
						tradeline.creditor === spouseTradeline.creditor &&
						dayjs(tradeline.opened).isSame(dayjs(spouseTradeline.opened)) &&
						tradeline.creditLimit === spouseTradeline.creditLimit
				),
			...tradeline,
		};
	});
};

const jointLoans = (
	creditEvaluation: LeanDocument<ICreditEvaluation>,
	spouseCreditEvaluation: LeanDocument<ICreditEvaluation> | null | undefined
) => {
	return creditEvaluation.loans.map((loan) => {
		return {
			joint:
				loan.accountType === 'Joint Account' &&
				spouseCreditEvaluation?.loans.some(
					(spouseLoan) =>
						loan.creditor === spouseLoan.creditor &&
						dayjs(loan.opened).isSame(dayjs(spouseLoan.opened)) &&
						loan.hpb === spouseLoan.hpb
				),
			...loan,
		};
	});
};

// Single Credit Evaluation Calculations
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
		debtDetails.deferredStudentLoans = parseFloat(debtDetails.calculatedDeferredStudentLoans.toFixed(2));
	}

	const debtPayment = debtDetails.overrideDebtPayment || debtDetails.debtPayment;
	debtDetails.totalDebtPayment =
		(debtPayment || 0) + (debtDetails.deferredStudentLoans || 0) + (debtDetails.rentPayment || 0);
	debtDetails.totalPayment =
		debtDetails.totalDebtPayment - (debtDetails.mortgagePayment ? debtDetails.mortgagePayment / 2 : 0);

	if (includeHousehold) {
		const customer = await Customer.findById(creditEvaluation.customer);
		if (customer?.spouse) {
			const spouseCreditEval = (await CreditEvaluation.findOne({
				customer: customer.spouse,
			}).lean()) as ICreditEvaluation;
			spouseCreditEval.debtDetails = await calculateDebtDetails(spouseCreditEval, false);
			spouseCreditEval.incomesOverview = calculateIncomesOverview(spouseCreditEval);

			if (spouseCreditEval.selectedHouseholdIncome) {
				debtDetails.spouseIncome =
					spouseCreditEval.incomesOverview.find((income) => income.type === spouseCreditEval.selectedHouseholdIncome)
						?.monthly ?? 0;
			}

			debtDetails.spousalDebt = spouseCreditEval.debtDetails.totalDebtPayment;

			const jointLoans = creditEvaluation.loans.filter((loan) => loan.status === 'opened' && loan.joint);
			if (jointLoans.length) {
				debtDetails.spousalDebt -= jointLoans.reduce((total, loan) => total + loan.payment, 0);
			} else {
				debtDetails.spousalDebt -=
					creditEvaluation.loans
						.filter((loan) => loan.status === 'opened' && loan.accountType === 'Joint Account')
						?.sort((a, b) => {
							const dateA = new Date(a.reportDate).getTime();
							const dateB = new Date(b.reportDate).getTime();
							return dateA > dateB ? -1 : 1;
						})?.[0]?.payment ?? 0;
			}

			const jointTradelines = creditEvaluation.tradelines.filter(
				(tradeline) => tradeline.status === 'opened' && tradeline.joint
			);
			if (jointTradelines.length) {
				debtDetails.spousalDebt -= jointTradelines.reduce((total, tradeline) => total + tradeline.payment, 0);
			} else {
				debtDetails.spousalDebt -=
					creditEvaluation.tradelines
						.filter((tradeline) => tradeline.accountType === 'Joint Account')
						?.sort((a, b) => {
							const dateA = new Date(a.reportDate).getTime();
							const dateB = new Date(b.reportDate).getTime();
							return dateA > dateB ? 1 : -1;
						})?.[0]?.payment ?? 0;
			}
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

	//@ts-expect-error
	creditEvaluation.summaryOfIncomes?.incomeSources?.forEach((income) => {
		if (!income.selected) return;
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

	if (creditEvaluation.statedMonthlyIncome) {
		incomesOverview.push({
			type: CreditEvaluationIncomeOverviewEnum.STATED_INCOME,
			dti: 0,
			monthly: creditEvaluation.statedMonthlyIncome,
			annual: creditEvaluation.statedMonthlyIncome * 12,
		});
	}

	let incomeYearsLength = 0;
	if (currentYearIncome.annual) {
		incomesOverview.push(currentYearIncome);
		incomeYearsLength += 1;
	}
	if (priorYearIncome.annual) {
		incomesOverview.push(priorYearIncome);
		incomeYearsLength += 1;
	}
	incomesOverview.push({
		...priorYearIncome,
		type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_2_YEAR_AVERAGE,
		annual: (priorYearIncome.annual + currentYearIncome.annual) / Math.min(2, incomeYearsLength),
	});

	if (prior2YearIncome.annual) {
		incomeYearsLength += 1;
	}
	incomesOverview.push({
		...priorYearIncome,
		type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_3_YEAR_AVERAGE,
		annual:
			(prior2YearIncome.annual + priorYearIncome.annual + currentYearIncome.annual) / Math.min(3, incomeYearsLength),
	});

	if (creditEvaluation.selectedHouseholdIncome) {
		const selectedIncome = incomesOverview.find(
			(income) => income.type === creditEvaluation.selectedHouseholdIncome
		) as CreditEvaluationIncomeOverview;

		if (selectedIncome) {
			if (creditEvaluation.debtDetails.deferredStudentLoans) {
				incomesOverview.push({
					...priorYearIncome,
					type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_STUDENT_LOAN_ADJUSTED,
					annual: selectedIncome.annual - creditEvaluation.debtDetails.deferredStudentLoans * 12,
				});
			}
			if (creditEvaluation.debtDetails.rentPayment) {
				incomesOverview.push({
					...priorYearIncome,
					type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_RENT_ADJUSTED,
					annual: selectedIncome.annual - creditEvaluation.debtDetails.rentPayment * 12,
				});
			}
			if (creditEvaluation.debtDetails.mortgagePayment) {
				incomesOverview.push({
					...priorYearIncome,
					type: CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_HALF_MORTGAGE,
					annual: selectedIncome.annual - creditEvaluation.debtDetails.mortgagePayment * 6,
				});
			}
			if (creditEvaluation.debtDetails.spouseIncome) {
				incomesOverview.push({
					...priorYearIncome,
					type: CreditEvaluationIncomeOverviewEnum.HOUSEHOLD_INCOME,
					annual: selectedIncome.annual + creditEvaluation.debtDetails.spouseIncome * 12,
					// - (creditEvaluation.debtDetails.spousalDebt || 0) * 12,
				});
			}
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

const calculateLoanAffordability = async (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const loanAffordabilitiesRaw: { source: CreditEvaluationLoanAffordabilityEnum; annual: number; debt: number }[] = [];
	const loanAffordabilities: CreditEvaluationLoanAffordability[] = [];
	const rate = creditEvaluation.loanAffordabilityRate || 14;
	const dti = 43;
	const debtPayment = creditEvaluation.debtDetails.overrideDebtPayment || creditEvaluation.debtDetails.debtPayment;

	if (creditEvaluation.selectedHouseholdIncome) {
		const selectedIncome = creditEvaluation.incomesOverview.find(
			(income) => income.type === creditEvaluation.selectedHouseholdIncome
		) as CreditEvaluationIncomeOverview;

		if (!selectedIncome) return [];

		loanAffordabilitiesRaw.push({
			source: CreditEvaluationLoanAffordabilityEnum.SELECTED_INCOME,
			annual: selectedIncome.annual,
			debt: debtPayment,
		});

		if (creditEvaluation.debtDetails.deferredStudentLoans) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFORDABILITY_INCLUDING_STUDENT_LOAN_DEBT,
				annual: selectedIncome.annual,
				debt: debtPayment + creditEvaluation.debtDetails.deferredStudentLoans,
			});
		}
		if (creditEvaluation.debtDetails.rentPayment) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFORDABILITY_INCLUDING_RENT,
				annual: selectedIncome.annual,
				debt: debtPayment + creditEvaluation.debtDetails.rentPayment,
			});
		}
		if (creditEvaluation.debtDetails.deferredStudentLoans && creditEvaluation.debtDetails.rentPayment) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFORDABILITY_INCLUDING_RENT_AND_DEFERRED_STUDENT_LOANS,
				annual: selectedIncome.annual,
				debt:
					debtPayment + creditEvaluation.debtDetails.rentPayment + creditEvaluation.debtDetails.deferredStudentLoans,
			});
		}
		if (creditEvaluation.debtDetails.mortgagePayment) {
			loanAffordabilitiesRaw.push({
				source: CreditEvaluationLoanAffordabilityEnum.AFFRODABILITY_HALF_MORTAGE,
				annual: selectedIncome.annual,
				debt: debtPayment - creditEvaluation.debtDetails.mortgagePayment / 2,
			});
		}

		// SPOUSE

		const customer = await Customer.findById(creditEvaluation.customer);
		if (customer?.spouse) {
			const spouseCreditEval = (await CreditEvaluation.findOne({
				customer: customer.spouse,
			}).lean()) as ICreditEvaluation;
			const spouseDebtPayment =
				spouseCreditEval.debtDetails.overrideDebtPayment || spouseCreditEval.debtDetails.debtPayment;

			if (creditEvaluation.debtDetails.spouseIncome) {
				loanAffordabilitiesRaw.push({
					source: CreditEvaluationLoanAffordabilityEnum.HOUSEHOLD_INCOME,
					annual: selectedIncome.annual + creditEvaluation.debtDetails.spouseIncome * 12,
					debt: debtPayment + spouseDebtPayment,
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
						debtPayment -
						creditEvaluation.debtDetails.mortgagePayment / 2 +
						(spouseDebtPayment - creditEvaluation.debtDetails.mortgagePayment / 2) +
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
						debtPayment -
						creditEvaluation.debtDetails.mortgagePayment / 2 +
						(spouseDebtPayment - creditEvaluation.debtDetails.mortgagePayment / 2) +
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
						debtPayment -
						creditEvaluation.debtDetails.mortgagePayment / 2 +
						(spouseDebtPayment - creditEvaluation.debtDetails.mortgagePayment / 2) +
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
