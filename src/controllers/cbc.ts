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
		user_data?: any;
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

// (async function () {
// 	console.log(await cbcAddUser());
// })();
