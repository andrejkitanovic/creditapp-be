import requireDir from 'require-dir';
import { Express } from 'express';

const dir = requireDir(__dirname);

export default function (app: Express) {
	Object.keys(dir).forEach((name) => {
		app.use(`/api/${name}`, dir[name].default);
	});
}
