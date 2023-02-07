import path from 'path';

import express, { Express } from 'express';
import multer from 'multer';
import auth from 'middlewares/auth';

export default function (app: Express) {
	const storage = multer.diskStorage({
		destination(req, file, cb) {
			cb(null, 'uploads');
		},
		filename(req, file, cb) {
			cb(null, `${Date.now()}-${file.originalname}`);
		},
	});

	app.use('/public', express.static(path.join(__dirname, '../../public')));
	app.use('/uploads', auth(['admin', 'user']), express.static(path.join(__dirname, '../../uploads')));
	app.use(multer({ storage }).single('file'));
}
