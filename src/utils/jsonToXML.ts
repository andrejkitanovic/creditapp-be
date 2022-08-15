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
