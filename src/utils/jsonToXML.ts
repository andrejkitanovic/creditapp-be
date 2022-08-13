export const jsonToXml = (obj: any) => {
	let xml = '';
	for (const prop in obj) {
		let parameter = '';
		let propText = prop;

		if (typeof prop === 'string') {
			if (prop.includes('[') && prop.includes(']')) {
				const typeRegex = /(?<=\[)(.*?)(?=\])/;
				const typeMatched = typeRegex.exec(prop)?.[0];

				parameter += ' ';
				parameter += `${typeMatched}`;

				propText = prop.replace(`[${typeMatched}]`, '');
			}
		}

		xml += obj[prop] instanceof Array ? '' : '<' + propText + `${parameter}>`;

		if (obj[prop] instanceof Array) {
			for (const array in obj[prop]) {
				xml += '<' + propText + '>';
				xml += jsonToXml(new Object(obj[prop][array]));
				xml += '</' + propText + '>';
			}
		} else if (typeof obj[prop] == 'object') {
			xml += jsonToXml(new Object(obj[prop]));
		} else {
			xml += obj[prop];
		}
		xml += obj[prop] instanceof Array ? '' : '</' + propText + '>';
	}
	xml = xml.replace(/<\/?[0-9]{1,}>/g, '');
	return xml;
};

export const xmlToJson = (xml: string) => {
	const json: any = {};

	for (const res of xml.matchAll(/(?:<(\w*)(?:\s[^>]*)*>)((?:(?!<\1).)*)(?:<\/\1>)|<(\w*)(?:\s*)*\/>/gm)) {
		const key = res[1] || res[3];
		const value = res[2] && xmlToJson(res[2]);
		json[key] = (value && Object.keys(value).length ? value : res[2]) || null;
	}

	return json;
};
