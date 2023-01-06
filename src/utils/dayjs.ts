import dayjs from 'dayjs';

export const dayjsUnix = (date: number | string | undefined) => {
	if (!date) return dayjs();

	return dayjs(parseInt(date as string));
};