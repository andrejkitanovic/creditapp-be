import axios from 'axios';
import crypto from 'crypto';
import { bin2hex } from 'utils/bin2hex';
import { jsonToXml } from 'utils/jsonToXML';
import cron from 'node-cron';
import CBC from 'models/cbc';
import dayjs from 'dayjs';

// ENV VARIABLES

const { CBC_URL, CBC_USER_ID, CBC_CUS_ID } = process.env;

// GENERATING AXIOS FOR CBC

const axiosCbc = axios.create({
	baseURL: CBC_URL,
	headers: {
		'Content-type': 'text/xml; charset=utf-8',
	},
});

// CRON JOBS

export const cbcCheckAndChangePassword = async () => {
	const cbcEntity = await CBC.findOne();

	if (cbcEntity && dayjs(cbcEntity.nextReset).subtract(1, 'd').diff(dayjs()) <= 0) {
		const newPassword = crypto.randomBytes(20).toString('hex');
		const md5 = crypto.createHash('md5').update(newPassword).digest('hex');
		const hashedPassword = bin2hex(md5);

		const xml = cbcXML({
			data_area: {
				header_data: {
					user_pwd: cbcEntity.password,
					new_pwd: hashedPassword,
					action: 'PWD_CHANGE',
				},
			},
		});

		await axiosCbc.post('', xml);

		await CBC.findOneAndUpdate(cbcEntity._id, {
			password: hashedPassword,
			nextReset: dayjs().add(85, 'day'),
		});
	}
};

cron.schedule('0 0 * * *', async () => {
	await cbcCheckAndChangePassword();
});

// GET PASSWORD
const cbcPassword = async () => {
	const cbcEntity = await CBC.findOne();

	if (cbcEntity && dayjs(cbcEntity.nextReset).diff(dayjs()) > 0) {
		return cbcEntity.password;
	} else {
		throw new Error('[CBC] Missing password!');
	}
};

type CBCJsonType = {
	data_area: {
		header_data: any;
		[key: string]: any;
	};
};

// GENERATE XML FOR CBC
const cbcXML = (data: CBCJsonType) => {
	const dataWCredentials = {
		...data,
		data_area: {
			...data.data_area,
			header_data: {
				user_id: CBC_USER_ID,
				cus_id: CBC_CUS_ID,
				...data.data_area.header_data,
			},
		},
	};

	return `
	<?xml version="1.0" encoding="utf-8"?>
	${jsonToXml(dataWCredentials)}
	`;
};

// CBC FUNCTIONS

type CBCUser = {
	ip: string;
	name: string;
	uid: string;
	password: string;
	email: string;
};

export const cbcAddUser = async (user: CBCUser) => {
	const md5 = crypto.createHash('md5').update(user.password).digest('hex');
	const hashedPassword = bin2hex(md5);

	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: await cbcPassword(),
				action: 'ADD_USER',
			},
			user_data: {
				ip: user.password,
				name: user.name,
				uid: user.uid,
				user_pwd: hashedPassword,
				emal: user.email,
			},
		},
	});

	return await axiosCbc.post('', xml);
};

export enum CBCRequestTypeEnum {
	EXPERIAN = 'XPN',
	TRANSUNION = 'TU',
	EQUIFAX = 'EXF',
	CLARITY_SERVICES = 'CL',
}

export type CBCApplicant = {
	personalBusiness: 'personal';
	firstName: string;
	middleName: string;
	lastName: string;
	generation?: 'JR' | 'SR' | 'I' | 'II' | 'III' | 'IV' | 'V';
	phone?: {
		areacode?: string;
		number?: string;
	};
	email: string;
	birthdate: string; // Format: MM/DD/YYYY
	ssn: string;
	address: {
		line: string;
		city: string;
		state: string;
		postalCode: string;
		periodType?: 'months';
		period?: number;
		mortgage?: number;
		housingStatus?: number;
	};
	employment?: {
		type: string;
		companyName: string;
		status: number;
		address: {
			line: string;
			city: string;
			state: string;
			postalCode: string;
		};
		occupation: string;
		period: number;
		salary: number;
		salaryPeriod: 'monthly';
	};
	driverLicense?: {
		number: string;
		state: string;
	};
	income?: {
		period: 'monthly';
		value: number;
		source: string;
	};
};

export const cbcPullCreditReport = async (applicant: CBCApplicant) => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: await cbcPassword(),
				action: 'XPN',
				single_joint: 1,
				// deal_status: dealStatus,
				pre_qual: 1,
				// app_id: '{8F7C2F65-D242-73F2-8242-746D080D5A8C}',
			},
			applicant_data: {
				[`applicant[type="primary"]`]: {
					personal_business: 'personal',
					person_name: {
						first_name: applicant.firstName,
						middle_name: applicant.middleName,
						last_name: applicant.lastName,
					},
					address_data: {
						[`address[type="current"]`]: {
							line_one: applicant.address.line,
							city: applicant.address.city,
							state_or_province: applicant.address.state,
							postal_code: applicant.address.postalCode,
							// [`period_of_residence[period="${applicant.address.periodType}"]`]: applicant.address.period,
							// mortgage_rent: applicant.address.mortgage,
							// housing_status: applicant.address.housingStatus,
						},
					},
					// contact_data: {
					// 	[`phone_no[areacode="${applicant.phone.areacode}"]`]: applicant.phone.number,
					// 	email: applicant.email,
					// },
					birthdate: applicant.birthdate,
					social: applicant.ssn,
					// drivers_license_no: applicant.driverLicense.number,
					// drivers_license_state: applicant.driverLicense.state,
					// employment_data: {
					// 	[`employer[type="${applicant.employment.type}"]`]: {
					// 		company_name: applicant.employment.companyName,
					// 		employment_status: applicant.employment.status,
					// 		address_data: {
					// 			line_one: applicant.employment.address.line,
					// 			city: applicant.employment.address.city,
					// 			state_or_province: applicant.employment.address.state,
					// 			postal_code: applicant.employment.address.postalCode,
					// 		},
					// 		occupation: applicant.employment.occupation,
					// 		period_of_employment: applicant.employment.period,
					// 		[`salary[period="${applicant.employment.salaryPeriod}"]`]: applicant.employment.salary,
					// 	},
					// },
					// other_income_data: {
					// 	[`income[period="${applicant.income?.period}"]`]: applicant.income.value,
					// 	source: applicant.income.source,
					// },
				},
			},
			// salesperson_data: {
			// 	[`salesperson[type="${sale.salesperson.type}"]`]: sale.salesperson.value,
			// },
			// sale_type: sale.type,
		},
	});

	return await axiosCbc.post('', xml);
};

export const cbcFormatMonths = (key: string): number | undefined => {
	if (!key) return;

	if (key === 'One month') {
		return 1;
	} else if (!isNaN(parseInt(key))) {
		return parseInt(key);
	}

	return undefined;
};

export const cbcFormatString = (key: string): string | undefined => {
	if (!key || typeof key !== 'string') return;

	return key;
};

export const cbcFormatDate = (key: string): Date | undefined => {
	if (!key || key === '/' || typeof key !== 'string') return;

	const dateParts = key.split('/');

	let date = dayjs('1970', 'YYYY').startOf('year');

	if (dateParts.length === 2) {
		let year = dateParts[1];

		if (year.length === 2) {
			if (parseInt(year) <= parseInt(dayjs().format('YY'))) {
				year = `20${year}`;
			} else year = `19${year}`;
		}

		date = date.set('month', parseInt(dateParts[0]) - 1);
		date = date.set('year', parseInt(year));

		return date.toDate();
	} else if (dateParts.length === 3) {
		let year = dateParts[2];

		if (year.length === 2) {
			if (parseInt(year) <= parseInt(dayjs().format('YY'))) {
				year = `20${year}`;
			} else year = `19${year}`;
		}

		date = date.set('month', parseInt(dateParts[0]) - 1);
		date = date.set('date', parseInt(dateParts[1]));
		date = date.set('year', parseInt(year));

		return date.toDate();
	}

	return;
};
