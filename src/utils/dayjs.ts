import dayjs from 'dayjs';

export const startOfYear = (year: number) => dayjs().set('year', year).startOf('year');
export const dayjsUnix = (date: number | string | undefined) => {
	if (!date) return dayjs();

	return dayjs(parseInt(date as string));
};
