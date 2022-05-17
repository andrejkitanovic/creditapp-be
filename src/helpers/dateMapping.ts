import dayjs, { ManipulateType } from 'dayjs';

export const populateDates = (
	dates: { startDate: Date, endDate?: Date },
	values: { date: string; value: number }[],
	period: 'month' | 'year'
) => {
	const dateMap = new Map<string, number>();

	let addBy: ManipulateType = 'day';
	let format = 'YYYY-MM-DD';

	if (period === 'year') {
		addBy = 'month';
		format = 'YYYY-MM';
	}

	let dateCounter = dates.startDate;
	const today = dates.endDate ?? dayjs().startOf('day').toDate();

	while (dateCounter < today) {
		dateMap.set(dayjs(dateCounter).format(format), 0);
		dateCounter = dayjs(dateCounter).add(1, addBy).toDate();
	}

	values.forEach(({ date, value }) => {
		dateMap.set(date, +Number(value).toFixed(0));
	});

	return {
		keys: Array.from(dateMap.keys()),
		values: Array.from(dateMap.values()),
	};
};
