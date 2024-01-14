import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault('Iceland');

export const startOfYear = (year: number) => dayjs.tz(dayjs()).set('year', year).startOf('year');
export const endOfYear = (year: number) => dayjs.tz(dayjs()).set('year', year).endOf('year');
export const dayjsUnix = (date: number | string | undefined) => {
	if (!date) return dayjs.tz(dayjs());

	return dayjs.tz(parseInt(date as string));
};

export default dayjs;