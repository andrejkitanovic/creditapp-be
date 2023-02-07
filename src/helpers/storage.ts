import path from 'path';

import express, { Express, RequestHandler } from 'express';
import multer from 'multer';
import auth from 'middlewares/auth';

const checkHeaders: RequestHandler = (req, res, next) => {
	if (req.headers['origin-host'] !== 'https://app.loanly.ai') {
		res.redirect('https://app.loanly.ai/file' + req.url);
	} else {
		next();
	}
};

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
	app.use('/uploads', checkHeaders, auth(['admin', 'user']), express.static(path.join(__dirname, '../../uploads')));
	app.use(multer({ storage }).single('file'));
}
