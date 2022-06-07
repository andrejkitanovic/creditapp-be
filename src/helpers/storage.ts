import multer from 'multer';
import express, { Express } from 'express';
import path from 'path';

export default function (app: Express) {
	const storage = multer.diskStorage({
		destination(req, file, cb) {
			cb(null, 'uploads');
		},
		filename(req, file, cb) {
			cb(null, `${Date.now()}-${file.originalname}`);
		},
	});

	app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
	app.use(multer({ storage }).single('file'));
}
