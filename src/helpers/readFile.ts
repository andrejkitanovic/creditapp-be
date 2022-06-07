import fs from 'fs';
import jade from 'jade';

export const readFile = async ({ path, context }: { path: string; context?: any }) => {
	try {
		const file = fs.readFileSync(path, 'utf8');
		const template = jade.compile(file, { filename: path });
		return template(context);
	} catch (err) {
		console.log(err);
	}
};
