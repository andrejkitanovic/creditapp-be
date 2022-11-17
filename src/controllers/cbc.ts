import axios from 'axios';
import crypto from 'crypto';
import { bin2hex } from 'utils/bin2hex';
import { jsonToXml } from 'utils/jsonToXML';

// Configuration
const { CBC_URL, CBC_USER_ID, CBC_CUS_ID } = process.env;

const axiosCbc = axios.create({
	baseURL: CBC_URL,
	headers: {
		'Content-type': 'text/xml; charset=utf-8',
	},
});

// Helpers
const cbcPassword = (password: string) => {
	const md5 = crypto.createHash('md5').update(password).digest('hex');
	const hashedPassword = bin2hex(md5);
	return hashedPassword;
};

type CBCJsonType = {
	data_area: {
		header_data: any;
		[key: string]: any;
	};
};
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

// Current password: test1234
const currentPassword = 'test1234';

// CBC Functions
export const cbcChangePassword = async (newPassword: string) => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: cbcPassword(currentPassword),
				new_pwd: cbcPassword(newPassword),
				action: 'PWD_CHANGE',
			},
		},
	});

	return await axiosCbc.post('', xml);
};

type CBCUser = {
	ip: string;
	name: string;
	uid: string;
	password: string;
	email: string;
};

export const cbcAddUser = async (user: CBCUser) => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: cbcPassword(currentPassword),
				action: 'ADD_USER',
			},
			user_data: {
				ip: user.password,
				name: user.name,
				uid: user.uid,
				user_pwd: cbcPassword(user.password),
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

enum CBCDealStatus {
	WORKING = 'Working',
	WEB_LEAD = 'Web Lead',
	SOLD = 'Sold',
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

// type CBCSale = {
// 	type: string;
// 	salesperson: {
// 		type: string;
// 		value: string;
// 	};
// };

export const cbcPullCreditReport = async (
	// type: CBCRequestTypeEnum,
	// dealStatus: CBCDealStatus,
	applicant: CBCApplicant
	// sale?: CBCSale
) => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: cbcPassword(currentPassword),
				action: 'XPN|TU|EFX|CL',
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

export const cbcPostCreditReport = async (
	applicant: CBCApplicant
	// sale?: CBCSale
) => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: cbcPassword(currentPassword),
				single_joint: 0,
				pre_qual: 0,
				action: 'CREDIT_APP',
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

// import fs from 'fs';
// import xmlToJson from 'xml2json';

// (async function () {
// 	console.log('START');

// 	const cbcApplicant: CBCApplicant = {
// 		personalBusiness: 'personal',
// 		firstName: 'EMILIONO',
// 		middleName: '',
// 		lastName: 'BROWN',
// 		email: '',
// 		birthdate: '10/16/1955',
// 		ssn: '666535944',
// 		address: {
// 			line: '900 NW LOVEJOY ST APT 901',
// 			city: 'PORTLAND',
// 			state: 'OR',
// 			postalCode: '972093482',
// 		},
// 	};
// 	const response = await cbcPullCreditReport(CBCRequestTypeEnum.EXPERIAN, CBCDealStatus.WEB_LEAD, cbcApplicant);

// 	const jsonResponse = JSON.parse(xmlToJson.toJson(response.data));
// 	fs.writeFile('response.json', JSON.stringify(jsonResponse), () => {
// 		console.log('Saved Response');
// 	});
// 	const htmlReport = jsonResponse.XML_INTERFACE.CREDITREPORT.REPORT;
// 	fs.writeFile('response.html', htmlReport, () => {
// 		console.log('Saved');
// 	});

// 	console.log('END');
// })();
