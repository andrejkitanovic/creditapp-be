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
	};
};
const cbcXML = (data: CBCJsonType) => {
	const dataWCredentials = {
		...data,
		data_area: {
			...data.data_area,
			header_data: {
				...data.data_area.header_data,
				user_id: CBC_USER_ID,
				cus_id: CBC_CUS_ID,
			},
		},
	};

	return `
	<?xml version="1.0" encoding="utf-8"?>
	${jsonToXml(dataWCredentials)}
	`;
};

// CBC Functions
export const cbcChangePassword = async () => {
	const xml = cbcXML({
		data_area: {
			header_data: {
				user_pwd: cbcPassword('password'),
				new_pwd: '1234',
				action: 'PWD_CHANGE',
			},
		},
	});

	return await axiosCbc.post('', xml);
};