export const bin2hex = (bin: string) => {
	// Converts the binary representation of data to hex
	//
	// version: 812.316
	// discuss at: http://phpjs.org/functions/bin2hex
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Onno Marsman
	// +   bugfixed by: Linuxworld
	// *     example 1: bin2hex('Kev');
	// *     returns 1: '4b6576'
	// *     example 2: bin2hex(String.fromCharCode(0x00));
	// *     returns 2: '00'

	let i,
		f = 0;
	const a = [];
	bin += '';
	f = bin.length;

	for (i = 0; i < f; i++) {
		a[i] = bin
			.charCodeAt(i)
			.toString(16)
			.replace(/^([\da-f])$/, '0$1');
	}

	return a.join('');
};
