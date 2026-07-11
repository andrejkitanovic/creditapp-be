import axios from 'axios';
import dayjs from 'dayjs';
import { LeanDocument } from 'mongoose';

import CreditEvaluation, {
	CreditEvaluationIncomeOverviewEnum,
	CreditEvaluationLoanAffordabilityEnum,
	ICreditEvaluation,
} from 'models/creditEvaluation';
import { ICustomer } from 'models/customer';
import { creditEvaluationCalculations } from 'utils/creditEvaluation/creditEvaluationCalculations';

const APP_URL = 'https://app.lendzee.ai';

const money = (n?: number | null) => (n || n === 0 ? `$${Math.round(n).toLocaleString('en-US')}` : undefined);
const moneyK = (n: number) => `$${(n / 1000).toFixed(1)}k`;
const percent = (ratio?: number) => (ratio && isFinite(ratio) ? `${(ratio * 100).toFixed(1)}%` : undefined);

const postToNotifier = async (payload: { [key: string]: unknown }) => {
	if (!process.env.SLACK_NOTIFIER_URL || !process.env.SLACK_NOTIFIER_SECRET) return null;

	const { data } = await axios.post(process.env.SLACK_NOTIFIER_URL, payload, {
		headers: { 'x-webhook-secret': process.env.SLACK_NOTIFIER_SECRET },
		timeout: 15_000,
	});
	return data as { ok: boolean; channel: string; ts: string };
};

const incomeLine = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const twoYearAverage = creditEvaluation.incomesOverview?.find(
		(income) => income.type === CreditEvaluationIncomeOverviewEnum.INDIVIDUAL_INCOME_2_YEAR_AVERAGE
	);
	if (!twoYearAverage?.annual || !isFinite(twoYearAverage.annual)) return undefined;

	const dti = percent(twoYearAverage.dti);
	return `${money(twoYearAverage.monthly)}/mo (${money(twoYearAverage.annual)}/yr)${dti ? ` · ${dti} DTI` : ''}`;
};

const affordabilityLine = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const affordability = creditEvaluation.loanAffordability?.find(
		(loanAffordability) => loanAffordability.source === CreditEvaluationLoanAffordabilityEnum.SELECTED_INCOME
	);
	if (!affordability || !isFinite(affordability.term60)) return undefined;

	return {
		label: `Affordability at ${affordability.rate}%`,
		value: `${moneyK(affordability.term60)} / 60mo · ${moneyK(affordability.term84)} / 84mo · ${moneyK(
			affordability.term120
		)} / 120mo`,
	};
};

const buildDetails = (creditEvaluation: LeanDocument<ICreditEvaluation>) => {
	const details: { [label: string]: string | undefined } = {};

	details['Verified income (2yr avg)'] = incomeLine(creditEvaluation);
	const affordability = affordabilityLine(creditEvaluation);
	if (affordability) details[affordability.label] = affordability.value;

	const openTradelines = (creditEvaluation.tradelines || []).filter((tradeline) => tradeline.status === 'opened');
	if (openTradelines.length) {
		const balance = openTradelines.reduce((total, tradeline) => total + (tradeline.balance || 0), 0);
		const limit = openTradelines.reduce((total, tradeline) => total + (tradeline.creditLimit || 0), 0);
		details['Revolving'] = `${money(balance)} bal / ${money(limit)} limit${
			limit ? ` · ${Math.round((balance / limit) * 100)}% utilized` : ''
		}`;
	}

	const autoLoans = (creditEvaluation.loans || []).filter(
		(loan) => loan.status === 'opened' && /auto/i.test(loan.typeDetail || '')
	);
	if (autoLoans.length) {
		const balance = autoLoans.reduce((total, loan) => total + (loan.balance || 0), 0);
		const payment = autoLoans.reduce((total, loan) => total + (loan.payment || 0), 0);
		details['Auto loans'] = `${autoLoans.length} open · ${money(balance)} bal · ${money(payment)}/mo`;
	}

	const inquiries = creditEvaluation.recentInquiries?.find((inquiry) => inquiry.type === 'XPN');
	if (inquiries) {
		const latest = [...(inquiries.inquiries || [])].sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))[0];
		details['Inquiries'] = `${inquiries.lastTwelveMonths ?? 0} in last 12mo${
			latest ? ` (${latest.name}, ${dayjs(latest.date).format('MM/YYYY')})` : ''
		}`;
	}

	if (creditEvaluation.ageOfFile) {
		const years = dayjs().diff(dayjs(creditEvaluation.ageOfFile), 'year');
		const revolvingMonths = creditEvaluation.averageMonthsOfOpenRevolvingCredit;
		details['File age'] = `${years} yrs${
			revolvingMonths ? ` · avg revolving age ${Math.floor(revolvingMonths / 12)}y ${Math.round(revolvingMonths % 12)}m` : ''
		}`;
	}

	const derogatoryCounts = [
		[creditEvaluation.latePayments?.length, 'lates'],
		[creditEvaluation.chargeOffs?.length, 'charge-offs'],
		[creditEvaluation.collections?.length, 'collections'],
		[creditEvaluation.publicRecords?.length, 'public records'],
	].filter(([count]) => count) as [number, string][];
	details['Derogatory'] = derogatoryCounts.length
		? derogatoryCounts.map(([count, label]) => `${count} ${label}`).join(' · ')
		: 'No lates, charge-offs, collections, or public records';

	return details;
};

const buildCardPayload = (creditEvaluation: LeanDocument<ICreditEvaluation>, customer: LeanDocument<ICustomer>) => {
	const statedIncome = creditEvaluation.incomesOverview?.find(
		(income) => income.type === CreditEvaluationIncomeOverviewEnum.STATED_INCOME
	);

	return {
		customerName: `${customer.firstName} ${customer.lastName}`,
		badges: [creditEvaluation.affordability, creditEvaluation.dealStatus].filter(Boolean),
		brand: customer.associatedBrand,
		dealId: creditEvaluation.hubspotDealId,
		customerId: String(customer._id),
		reportDate: creditEvaluation.reportDate ? dayjs(creditEvaluation.reportDate).format('MM/DD/YYYY') : undefined,
		stats: {
			'Score (XPN)': creditEvaluation.creditScores?.find((creditScore) => creditScore.type === 'XPN')?.score,
			'DTI (stated)': percent(statedIncome?.dti),
			'Monthly income': money(creditEvaluation.statedMonthlyIncome),
			'Debt pmt': money(creditEvaluation.debtDetails?.overrideDebtPayment || creditEvaluation.debtDetails?.debtPayment),
		},
		details: buildDetails(creditEvaluation),
		analystNotes: creditEvaluation.notes,
		links: {
			'View customer': `${APP_URL}/customers/${customer._id}`,
		},
		buttons: {
			'Open in Lendzee': `${APP_URL}/credit-evaluations/${creditEvaluation._id}`,
			'HTML report': creditEvaluation.html,
			'PDF report': creditEvaluation.pdf,
		},
	};
};

const buildEvalPayload = (creditEvaluation: LeanDocument<ICreditEvaluation>, customer: LeanDocument<ICustomer>) => {
	const details = buildDetails(creditEvaluation);

	return {
		title: `Credit evaluation: ${customer.firstName} ${customer.lastName}`,
		customerName: `${customer.firstName} ${customer.lastName}`,
		color: '#daa038',
		badges: [creditEvaluation.affordability, creditEvaluation.dealStatus].filter(Boolean),
		dealId: creditEvaluation.hubspotDealId,
		customerId: String(customer._id),
		details: {
			'Debt pmt': money(creditEvaluation.debtDetails?.overrideDebtPayment || creditEvaluation.debtDetails?.debtPayment),
			'Total monthly debt': money(creditEvaluation.debtDetails?.totalDebtPayment),
			'Verified income (2yr avg)': details['Verified income (2yr avg)'],
			...Object.fromEntries(Object.entries(details).filter(([label]) => label.startsWith('Affordability at'))),
			'Selected income': creditEvaluation.selectedHouseholdIncome?.replace(/-/g, ' '),
		},
		analystNotes: creditEvaluation.notes,
		buttons: {
			'Open in Lendzee': `${APP_URL}/credit-evaluations/${creditEvaluation._id}`,
		},
	};
};

const loadCalculated = async (creditEvaluationId: string) => {
	const creditEvaluation = (await CreditEvaluation.findById(creditEvaluationId)
		.populate({ path: 'customer', populate: { path: 'spouse' } })
		.lean()) as LeanDocument<ICreditEvaluation> | null;
	if (!creditEvaluation?.customer) return null;

	const calculated = await creditEvaluationCalculations(creditEvaluation);
	return { creditEvaluation: calculated, customer: creditEvaluation.customer as unknown as LeanDocument<ICustomer> };
};

// creation: post the report card in the channel, then the evaluation message in its thread
export const slackNotifyCreditEvaluationCreated = async (creditEvaluationId: string) => {
	try {
		const loaded = await loadCalculated(creditEvaluationId);
		if (!loaded) return;

		const card = await postToNotifier(buildCardPayload(loaded.creditEvaluation, loaded.customer));
		if (!card?.ts) return;

		const evalMessage = await postToNotifier({
			...buildEvalPayload(loaded.creditEvaluation, loaded.customer),
			channel: card.channel,
			thread_ts: card.ts,
		});

		await CreditEvaluation.findByIdAndUpdate(creditEvaluationId, {
			slackMessage: { channel: card.channel, ts: card.ts, evalTs: evalMessage?.ts },
		});
	} catch (err) {
		console.error('slack notify (created) failed:', (err as Error).message);
	}
};

// edits: update the threaded evaluation message in place (post it if the card exists without one)
export const slackNotifyCreditEvaluationUpdated = async (creditEvaluationId: string) => {
	try {
		const loaded = await loadCalculated(creditEvaluationId);
		if (!loaded?.creditEvaluation.slackMessage?.ts) return;

		const { channel, ts, evalTs } = loaded.creditEvaluation.slackMessage;
		const payload = {
			...buildEvalPayload(loaded.creditEvaluation, loaded.customer),
			channel,
			...(evalTs ? { ts: evalTs } : { thread_ts: ts }),
		};

		const evalMessage = await postToNotifier(payload);
		if (!evalTs && evalMessage?.ts) {
			await CreditEvaluation.findByIdAndUpdate(creditEvaluationId, { 'slackMessage.evalTs': evalMessage.ts });
		}
	} catch (err) {
		console.error('slack notify (updated) failed:', (err as Error).message);
	}
};
