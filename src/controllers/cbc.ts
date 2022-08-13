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

// Current password: test123

// CBC Functions
export const cbcChangePassword = async (newPassword: string) => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: cbcPassword('test123'),
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
				user_pwd: cbcPassword('test123'),
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

export const cbcMakeRequest = async () => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: cbcPassword('test123'),
				action: 'XPN',
				single_joint: 0,
				deal_status: 'Web Leads',
				pre_qual: 1,
			},
			applicant_data: {
				[`applicant[type="primary"]`]: {
					person_name: {
						first_name: 'LOANLY',
						middle_name: 'DECKER',
						last_name: 'APP',
					},
					address_data: {
						[`address[type="current"]`]: {
							line_one: '3207 DORIS',
							city: 'ANCHORAGE',
							state_or_province: 'AK',
							postal_code: '99517',
							[`period_of_residence[period="months"]`]: 24,
							mortgage_rent: 1400,
							housing_status: 1,
						},
					},
					contact_data: {
						[`phone_no[areacode="555"]`]: '5555555',
						email: 'paul@example.com',
					},
					birthdate: '02/10/1958',
					social: '666466693',
					drivers_license_no: '99999999',
					drivers_license_state: 'CA',
					employment_data: {
						[`employer[type="current"]`]: {
							company_name: 'Applet Inc',
							employment_status: 2,
							address_data: {
								line_one: '19103 TAJAUTA AVE',
								city: 'CARSON',
								state_or_province: 'CA',
								postal_code: '90746',
							},
							occupation: 'Software Developer',
							period_of_employment: 60,
							[`salary[period="monthly"]`]: 8000,
						},
					},
					other_income_data: {
						[`income[period="monthly"]`]: 1500,
						source: 'Annuities',
					},
				},
			},
			salesperson_data: {
				[`salesperson[type="salesmanager"]`]: 'FIRST_FINANCIAL',
			},
			sale_type: 'Used',
		},
	});

	return await axiosCbc.post('', xml);
};

// import fs from 'fs';
// (async function () {
// 	const response = await cbcMakeRequest();

// 	fs.writeFile('response.txt', response.data, () => {
// 		console.log("DONE")
// 	});
// })();
